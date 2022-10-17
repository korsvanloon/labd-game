import { Angles } from './madgwick'
import {
  calculateActualAccelerometer,
  calculateActualGyroscope,
  parseAccelerometers,
  parseAnalogStickLeft,
  parseAnalogStickRight,
  parseBatteryLevel,
  parseCompleteButtonStatusLeft,
  parseCompleteButtonStatusRight,
  parseDeviceInfo,
  parseGyroscopes,
  toEulerAngles,
  toEulerAnglesQuaternion,
  toQuaternion,
} from './parse'

const report = {
  subCommand: 0x21,
  fullMode: 0x30,
}

export const createPacket = (
  reportId: number,
  productId: number,
  data: Uint8Array,
  lastEulerAngles: Angles,
  lastTimeStamp?: number,
) => {
  const isLeft = productId === 0x2006
  const isRight = productId === 0x2007

  switch (reportId) {
    case report.subCommand:
      return {
        type: 'sub_command' as const,
        batteryLevel: parseBatteryLevel(data),
        buttonStatus: isLeft
          ? parseCompleteButtonStatusLeft(data)
          : parseCompleteButtonStatusRight(data),
        ...(isLeft ? { analogStickLeft: parseAnalogStickLeft(data) } : {}),
        ...(isRight ? { analogStickRight: parseAnalogStickRight(data) } : {}),
        //
        deviceInfo: parseDeviceInfo(data),
      }
    case report.fullMode: {
      const accelerometers = parseAccelerometers(data)
      const gyroscopes = parseGyroscopes(data)
      const revolutionsPerSecond = calculateActualGyroscope(
        gyroscopes.map((g) => g.map((v) => v.rps)),
      )
      const degreesPerSecond = calculateActualGyroscope(
        gyroscopes.map((g) => g.map((v) => v.dps)),
      )
      const acc = calculateActualAccelerometer(accelerometers)
      const quaternion = toQuaternion(revolutionsPerSecond, acc, productId)

      return {
        type: 'full_mode' as const,
        batteryLevel: parseBatteryLevel(data),
        buttonStatus: isLeft
          ? parseCompleteButtonStatusLeft(data)
          : parseCompleteButtonStatusRight(data),
        ...(isLeft ? { analogStickLeft: parseAnalogStickLeft(data) } : {}),
        ...(isRight ? { analogStickRight: parseAnalogStickRight(data) } : {}),
        accelerometer: acc,
        gyroscope: {
          degreesPerSecond,
          revolutionsPerSecond,
        },
        orientation: toEulerAngles(
          lastEulerAngles,
          revolutionsPerSecond,
          acc,
          productId,
          lastTimeStamp,
        ),
        orientationQuaternion: toEulerAnglesQuaternion(quaternion),
        quaternion: quaternion,
      }
    }
    default: {
      return {
        type: 'unknown' as const,
        reportId,
      }
    }
  }
}
