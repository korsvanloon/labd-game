import { Angles, Madgwick, Point3, Point4 } from './madgwick'

const leftMadgwick = Madgwick(10)
const rightMadgwick = Madgwick(10)
const rad2deg = 180.0 / Math.PI

/* eslint-disable require-jsdoc */

function baseSum<T>(array: T[], iteratee: (i: T) => number) {
  let result = 0

  for (const value of array) {
    const current = iteratee(value)
    if (current !== undefined) {
      result = result === undefined ? current : result + current
    }
  }
  return result
}

const mean = (array: number[]) => baseMean(array, (value) => value)

const baseMean = <T>(array: T[], iteratee: (i: T) => number) =>
  baseSum(array, iteratee) / array.length

const ControllerType = {
  0x1: 'Left Joy-Con',
  0x2: 'Right Joy-Con',
  0x3: 'Pro Controller',
}

const bias = 0.75
const zeroBias = 0.0125

// As we only can cover half (PI rad) of the full spectrum (2*PI rad) we multiply
// the unit vector with values from [-1, 1] with PI/2, covering [-PI/2, PI/2].
const scale = Math.PI / 2

/**
 * Applies a complementary filter to obtain Euler angles from gyroscope and
 * accelerometer data.
 */
export function toEulerAngles(
  lastEulerAngles: Angles,
  gyroscope: Point3,
  accelerometer: Point3,
  productId: number,
  lastTimestamp?: number,
) {
  const now = Date.now()
  const dt = lastTimestamp ? (now - lastTimestamp) / 1000 : 0

  // Treat the acceleration vector as an orientation vector by normalizing it.
  // Keep in mind that if the device is flipped, the vector will just be
  // pointing in the other direction, so we have no way to know from the
  // accelerometer data which way the device is oriented.
  const norm = Math.sqrt(
    accelerometer.x ** 2 + accelerometer.y ** 2 + accelerometer.z ** 2,
  )

  lastEulerAngles.alpha =
    (1 - zeroBias) * (lastEulerAngles.alpha + gyroscope.z * dt)
  if (norm !== 0) {
    lastEulerAngles.beta =
      bias * (lastEulerAngles.beta + gyroscope.x * dt) +
      (1.0 - bias) * ((accelerometer.x * scale) / norm)
    lastEulerAngles.gamma =
      bias * (lastEulerAngles.gamma + gyroscope.y * dt) +
      (1.0 - bias) * ((accelerometer.y * -scale) / norm)
  }
  return {
    alpha:
      // ToDo: I could only get this to work with a magic multiplier (430).
      productId === 0x2006
        ? (
            (((-1 * (lastEulerAngles.alpha * 180)) / Math.PI) * 430) %
            90
          ).toFixed(6)
        : ((((lastEulerAngles.alpha * 180) / Math.PI) * 430) % 360).toFixed(6),
    beta: ((-1 * (lastEulerAngles.beta * 180)) / Math.PI).toFixed(6),
    gamma:
      productId === 0x2006
        ? ((-1 * (lastEulerAngles.gamma * 180)) / Math.PI).toFixed(6)
        : ((lastEulerAngles.gamma * 180) / Math.PI).toFixed(6),
  }
}

export function toEulerAnglesQuaternion(q: Point4) {
  const ww = q.w * q.w
  const xx = q.x * q.x
  const yy = q.y * q.y
  const zz = q.z * q.z
  return {
    alpha: (
      rad2deg * Math.atan2(2 * (q.x * q.y + q.z * q.w), xx - yy - zz + ww)
    ).toFixed(6),
    beta: (rad2deg * -Math.asin(2 * (q.x * q.z - q.y * q.w))).toFixed(6),
    gamma: (
      rad2deg * Math.atan2(2 * (q.y * q.z + q.x * q.w), -xx - yy + zz + ww)
    ).toFixed(6),
  }
}

export function toQuaternion(gyro: Point3, accl: Point3, productId: number) {
  if (productId === 0x2006) {
    leftMadgwick.update(gyro.x, gyro.y, gyro.z, accl.x, accl.y, accl.z)
    return leftMadgwick.getQuaternion()
  }
  rightMadgwick.update(gyro.x, gyro.y, gyro.z, accl.x, accl.y, accl.z)
  return rightMadgwick.getQuaternion()
}

/**
 * Check on [Documentation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#accelerometer---acceleration-in-g)
 */
function toAcceleration(value: Uint8Array): number {
  const view = new DataView(value.buffer)
  return parseFloat((0.000244 * view.getInt16(0, true)).toFixed(6))
}

/**
 * Check on [Documentation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#gyroscope---rotation-in-degreess---dps)
 */
function toDegreesPerSecond(value: Uint8Array): number {
  const view = new DataView(value.buffer)
  return parseFloat((0.06103 * view.getInt16(0, true)).toFixed(6))
}

/**
 * Check on [Documentation of Nintendo_Switch_Reverse_Engineering](https://github.com/dekuNukem/Nintendo_Switch_Reverse_Engineering/blob/master/imu_sensor_notes.md#gyroscope---rotation-in-revolutionss)
 */
function toRevolutionsPerSecond(value: Uint8Array): number {
  const view = new DataView(value.buffer)
  return parseFloat((0.0001694 * view.getInt16(0, true)).toFixed(6))
}

export function parseDeviceInfo(rawData: Uint8Array) {
  const bytes = rawData.slice(15, 15 + 11)
  const firmwareMajorVersionRaw = bytes.slice(0, 1)[0] // index 0
  const firmwareMinorVersionRaw = bytes.slice(1, 2)[0] // index 1
  const typeRaw = bytes.slice(2, 3) // index 2
  const macAddressRaw = bytes.slice(4, 10) // index 4-9
  const macAddress: string[] = []
  macAddressRaw.forEach((number) => {
    macAddress.push(number.toString(16))
  })
  const spiColorInUseRaw = bytes.slice(11, 12) // index 11

  const result = {
    firmwareVersion: {
      major: firmwareMajorVersionRaw,
      minor: firmwareMinorVersionRaw,
    },
    type: ControllerType[typeRaw[0] as 1 | 2 | 3],
    macAddress: macAddress.join(':'),
    spiColorInUse: spiColorInUseRaw[0] === 0x1,
  }
  return result
}

export function parseBatteryLevel(rawData: Uint8Array) {
  return {
    level: rawData[0] >> 4,
    charging: Boolean(rawData[0] & 0x01),
  }
}
export function parseCompleteButtonStatusLeft(rawData: Uint8Array) {
  return {
    // Byte 5 (Left Joy-Con)
    down: Boolean(0x01 & rawData[5]),
    up: Boolean(0x02 & rawData[5]),
    right: Boolean(0x04 & rawData[5]),
    left: Boolean(0x08 & rawData[5]),
    l: Boolean(0x40 & rawData[5]),
    zl: Boolean(0x80 & rawData[5]),
    // Byte 3,5 (Shared)
    sr: Boolean(0x10 & rawData[3]) || Boolean(0x10 & rawData[5]),
    sl: Boolean(0x20 & rawData[3]) || Boolean(0x20 & rawData[5]),
    // Byte 4 (Shared)
    minus: Boolean(0x01 & rawData[4]),
    leftStick: Boolean(0x08 & rawData[4]),
    capture: Boolean(0x20 & rawData[4]),
    chargingGrip: Boolean(0x80 & rawData[4]),
  }
}

export function parseCompleteButtonStatusRight(rawData: Uint8Array) {
  return {
    // Byte 3 (Right Joy-Con)
    y: Boolean(0x01 & rawData[3]),
    x: Boolean(0x02 & rawData[3]),
    b: Boolean(0x04 & rawData[3]),
    a: Boolean(0x08 & rawData[3]),
    r: Boolean(0x40 & rawData[3]),
    zr: Boolean(0x80 & rawData[3]),
    // Byte 3,5 (Shared)
    sr: Boolean(0x10 & rawData[3]) || Boolean(0x10 & rawData[5]),
    sl: Boolean(0x20 & rawData[3]) || Boolean(0x20 & rawData[5]),
    // Byte 4 (Shared)
    plus: Boolean(0x02 & rawData[4]),
    rightStick: Boolean(0x04 & rawData[4]),
    home: Boolean(0x10 & rawData[4]),
    chargingGrip: Boolean(0x80 & rawData[4]),
  }
}

export function parseAnalogStickLeft(rawData: Uint8Array) {
  const horizontal = rawData[6] | ((rawData[7] & 0xf) << 8)
  const vertical = ((rawData[7] >> 4) | (rawData[8] << 4)) * -1

  const hmin = 680
  const hmax = 3300
  const vmin = -3300
  const vmax = -1040
  return {
    horizontal: (((horizontal - hmin) / (hmax - hmin) - 0.5) * 2).toFixed(1),
    vertical: (((vertical - vmin) / (vmax - vmin) - 0.5) * 2).toFixed(1),
  }
}

export function parseAnalogStickRight(rawData: Uint8Array) {
  const horizontal = rawData[9] | ((rawData[10] & 0xf) << 8)
  const vertical = ((rawData[10] >> 4) | (rawData[11] << 4)) * -1

  const hmin = 730
  const hmax = 3430
  const vmin = -2920
  const vmax = -720
  return {
    horizontal: (((horizontal - hmin) / (hmax - hmin) - 0.5) * 2).toFixed(1),
    vertical: (((vertical - vmin) / (vmax - vmin) - 0.5) * 2).toFixed(1),
  }
}

export function parseAccelerometers(rawData: Uint8Array) {
  return [
    {
      x: toAcceleration(rawData.slice(13, 15)),
      y: toAcceleration(rawData.slice(15, 17)),
      z: toAcceleration(rawData.slice(17, 19)),
    },
    {
      x: toAcceleration(rawData.slice(25, 27)),
      y: toAcceleration(rawData.slice(27, 29)),
      z: toAcceleration(rawData.slice(29, 31)),
    },
    {
      x: toAcceleration(rawData.slice(37, 39)),
      y: toAcceleration(rawData.slice(39, 41)),
      z: toAcceleration(rawData.slice(41, 43)),
    },
  ]
}

export function parseGyroscopes(rawData: Uint8Array) {
  const gyroscopes = [
    [
      {
        dps: toDegreesPerSecond(rawData.slice(19, 21)),
        rps: toRevolutionsPerSecond(rawData.slice(19, 21)),
      },
      {
        dps: toDegreesPerSecond(rawData.slice(21, 23)),
        rps: toRevolutionsPerSecond(rawData.slice(21, 23)),
      },
      {
        dps: toDegreesPerSecond(rawData.slice(23, 25)),
        rps: toRevolutionsPerSecond(rawData.slice(23, 25)),
      },
    ],
    [
      {
        dps: toDegreesPerSecond(rawData.slice(31, 33)),
        rps: toRevolutionsPerSecond(rawData.slice(31, 33)),
      },
      {
        dps: toDegreesPerSecond(rawData.slice(33, 35)),
        rps: toRevolutionsPerSecond(rawData.slice(33, 35)),
      },
      {
        dps: toDegreesPerSecond(rawData.slice(35, 37)),
        rps: toRevolutionsPerSecond(rawData.slice(35, 37)),
      },
    ],
    [
      {
        dps: toDegreesPerSecond(rawData.slice(43, 45)),
        rps: toRevolutionsPerSecond(rawData.slice(43, 45)),
      },
      {
        dps: toDegreesPerSecond(rawData.slice(45, 47)),
        rps: toRevolutionsPerSecond(rawData.slice(45, 47)),
      },
      {
        dps: toDegreesPerSecond(rawData.slice(47, 49)),
        rps: toRevolutionsPerSecond(rawData.slice(47, 49)),
      },
    ],
  ]

  return gyroscopes
}

export function calculateActualAccelerometer(accelerometers: Point3[]) {
  const elapsedTime = 0.005 * accelerometers.length // Spent 5ms to collect each data.

  return {
    x: parseFloat(
      (mean(accelerometers.map((g) => g.x)) * elapsedTime).toFixed(6),
    ),
    y: parseFloat(
      (mean(accelerometers.map((g) => g.y)) * elapsedTime).toFixed(6),
    ),
    z: parseFloat(
      (mean(accelerometers.map((g) => g.z)) * elapsedTime).toFixed(6),
    ),
  }
}

export function calculateActualGyroscope(gyroscopes: number[][]) {
  const elapsedTime = 0.005 * gyroscopes.length // Spent 5ms to collect each data.

  const actualGyroscopes = [
    mean(gyroscopes.map((g) => g[0])),
    mean(gyroscopes.map((g) => g[1])),
    mean(gyroscopes.map((g) => g[2])),
  ].map((v) => parseFloat((v * elapsedTime).toFixed(6)))

  return {
    x: actualGyroscopes[0],
    y: actualGyroscopes[1],
    z: actualGyroscopes[2],
  }
}

export function parseRingCon(rawData: Uint8Array) {
  return {
    strain: new DataView(rawData.buffer, 39, 2).getInt16(0, true),
  }
}
