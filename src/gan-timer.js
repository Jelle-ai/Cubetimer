// Web Bluetooth client for the GAN Smart Timer.
// Protocol (service/characteristics, packet layout, CRC) as implemented in
// afedotov/gan-web-bluetooth.

const SERVICE = '0000fff0-0000-1000-8000-00805f9b34fb';
const TIME_CHARACTERISTIC = '0000fff2-0000-1000-8000-00805f9b34fb';
const STATE_CHARACTERISTIC = '0000fff5-0000-1000-8000-00805f9b34fb';

const BATTERY_SERVICE = 0x180f;
const BATTERY_LEVEL = 0x2a19;

/**
 * A browser only reveals services a page asked for up front. Keep this to the
 * timer service plus the two standard ones: asking for unusual UUIDs makes the
 * permission request larger for no gain, and some of them are blocked outright
 * depending on the browser and the platform.
 */
const OPTIONAL_SERVICES = [SERVICE, BATTERY_SERVICE, 0x180a];

export const TimerState = {
  DISCONNECT: 0,
  GET_SET: 1,   // grace delay passed, timer is armed
  HANDS_OFF: 2, // hands lifted before the grace delay passed
  RUNNING: 3,
  STOPPED: 4,   // carries the recorded time
  IDLE: 5,
  HANDS_ON: 6,
  FINISHED: 7
};

export function isSupported() {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth;
}

function crc16ccitt(bytes) {
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) > 0 ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
  }
  return crc & 0xffff;
}

function isValidEvent(data) {
  if (!data || data.byteLength < 6 || data.getUint8(0) !== 0xfe) return false;
  const expected = data.getUint16(data.byteLength - 2, true);
  const body = new Uint8Array(data.buffer, data.byteOffset + 2, data.byteLength - 4);
  return expected === crc16ccitt(body);
}

/** Timer sends minutes, seconds and a little-endian millisecond word. */
function readTime(data, offset) {
  const minutes = data.getUint8(offset);
  const seconds = data.getUint8(offset + 1);
  const milliseconds = data.getUint16(offset + 2, true);
  return minutes * 60000 + seconds * 1000 + milliseconds;
}

/**
 * Ask the user to pick a GAN timer and start listening to its state events.
 * @param {object} handlers
 * @param {(event: {state: number, time?: number}) => void} handlers.onEvent
 * @param {() => void} [handlers.onDisconnect]
 */
export async function connectGanTimer({ onEvent, onDisconnect }) {
  if (!isSupported()) throw new Error('Web Bluetooth is niet beschikbaar in deze browser.');
  return attach(await pickDevice(), { onEvent, onDisconnect });
}

const cancelled = (error) => /cancel|chooser/i.test(error?.message || '');

/**
 * Show the browser's device chooser. Some browsers refuse a request before the
 * chooser ever appears — over a name filter they dislike, or over a service in
 * the list they will not hand out. So if the narrow request is turned away
 * without the user having seen anything, ask again in the plainest possible
 * form: every device, and only the timer service.
 */
async function pickDevice() {
  try {
    return await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'GAN' }, { namePrefix: 'Gan' }, { namePrefix: 'gan' }],
      optionalServices: OPTIONAL_SERVICES
    });
  } catch (error) {
    if (cancelled(error)) throw error; // the user closed the chooser themselves
    return navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE]
    });
  }
}

/** Whether this device has bluetooth at all, as far as the browser will say. */
export async function bluetoothAvailable() {
  try {
    return await navigator.bluetooth?.getAvailability?.() ?? null;
  } catch {
    return null;
  }
}

/** A first GATT connect often fails on a timer that just woke up. */
async function connectWithRetry(device, attempts = 3) {
  let last = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await device.gatt.connect();
    } catch (error) {
      last = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }
  throw last;
}

async function attach(device, { onEvent, onDisconnect }) {
  const server = await connectWithRetry(device);

  let service;
  try {
    service = await server.getPrimaryService(SERVICE);
  } catch {
    if (server.connected) server.disconnect();
    throw new Error(`${device.name || 'Dit apparaat'} biedt de tijd-dienst van de GAN timer niet aan.`);
  }

  const timeChar = await service.getCharacteristic(TIME_CHARACTERISTIC);
  const stateChar = await service.getCharacteristic(STATE_CHARACTERISTIC);

  const handleValue = (event) => {
    const data = event.target.value;
    if (!isValidEvent(data)) return;
    const state = data.getUint8(3);
    onEvent(state === TimerState.STOPPED && data.byteLength >= 10
      ? { state, time: readTime(data, 4) }
      : { state });
  };

  const handleGattDisconnect = () => {
    stateChar.removeEventListener('characteristicvaluechanged', handleValue);
    device.removeEventListener('gattserverdisconnected', handleGattDisconnect);
    onDisconnect?.();
  };

  stateChar.addEventListener('characteristicvaluechanged', handleValue);
  device.addEventListener('gattserverdisconnected', handleGattDisconnect);
  await stateChar.startNotifications();

  return {
    name: device.name || 'GAN timer',
    /** Battery percentage, when the timer publishes it. */
    async getBattery() {
      try {
        const service = await server.getPrimaryService(BATTERY_SERVICE);
        const level = await (await service.getCharacteristic(BATTERY_LEVEL)).readValue();
        return level.getUint8(0);
      } catch {
        return null;
      }
    },
    /**
     * Everything this timer exposes over bluetooth, for the settings panel.
     * Only services listed in optionalServices are reachable.
     */
    async describe() {
      try {
        const services = await server.getPrimaryServices();
        return await Promise.all(services.map(async (s) => ({
          service: s.uuid,
          characteristics: (await s.getCharacteristics()).map((c) => ({
            uuid: c.uuid,
            properties: Object.entries(c.properties)
              .filter(([, enabled]) => enabled)
              .map(([name]) => name)
          }))
        })));
      } catch {
        return [];
      }
    },
    /**
     * The times the timer keeps in its own memory: the one on the display
     * followed by the previous ones, four bytes each. Every slot the
     * characteristic hands over is read, not just the first four, in case a
     * timer offers more.
     */
    async getRecordedTimes() {
      const data = await timeChar.readValue();
      const slots = Math.floor(data.byteLength / 4);
      if (slots < 1) throw new Error('Onverwachte data van de timer.');

      const times = [];
      for (let slot = 0; slot < slots; slot++) times.push(readTime(data, slot * 4));
      return times;
    },
    async disconnect() {
      await stateChar.stopNotifications().catch(() => {});
      handleGattDisconnect();
      if (server.connected) server.disconnect();
    }
  };
}
