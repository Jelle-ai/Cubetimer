// Web Bluetooth client for the GAN Smart Timer.
// Protocol (service/characteristics, packet layout, CRC) as implemented in
// afedotov/gan-web-bluetooth.

const SERVICE = '0000fff0-0000-1000-8000-00805f9b34fb';
const TIME_CHARACTERISTIC = '0000fff2-0000-1000-8000-00805f9b34fb';
const STATE_CHARACTERISTIC = '0000fff5-0000-1000-8000-00805f9b34fb';

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

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: 'GAN' }, { namePrefix: 'Gan' }, { namePrefix: 'gan' }],
    optionalServices: [SERVICE]
  });
  return attach(device, { onEvent, onDisconnect });
}

/**
 * Reconnect to a timer this browser already has permission for, without asking
 * anything. Only some browsers expose that list; elsewhere this is a no-op.
 * @returns {Promise<object|null>} the connection, or null when it is not possible
 */
export async function reconnectGanTimer({ onEvent, onDisconnect }) {
  if (!isSupported() || !navigator.bluetooth.getDevices) return null;
  try {
    const known = await navigator.bluetooth.getDevices();
    const device = known.find((candidate) => /^gan/i.test(candidate.name || ''));
    if (!device) return null;
    return await attach(device, { onEvent, onDisconnect });
  } catch {
    return null; // timer switched off, out of range, or permission withdrawn
  }
}

async function attach(device, { onEvent, onDisconnect }) {
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(SERVICE);
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
