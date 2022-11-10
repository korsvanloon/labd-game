import { clamp } from '../../util/math'
import { JoyCon } from './joycon'
import { Angles, Point2 } from './madgwick'

type BaseJoyConEvent = { controller: JoyCon; controllerId: number }
export type JoyConEvent =
  | ButtonEvent
  | MoveEvent
  | AccelerationEvent
  | OrientationEvent
  | BatteryEvent
  | DeviceInfoEvent

export type ButtonEvent = BaseJoyConEvent & {
  type: 'button'

  soloValue?:
    | 'down' // left, a
    | 'up' // right, y
    | 'right' // down, x
    | 'left' // up, b
    | 'stick' // leftStick, rightStick
    | 'bumperLeft' // sl
    | 'bumperRight' // sr
    | 'special' // minus, plus
  value?:
    | 'down'
    | 'up'
    | 'right'
    | 'left'
    | 'l'
    | 'zl'
    | 'sr'
    | 'sl'
    | 'minus'
    | 'leftStick'
    | 'capture'
    | 'chargingGrip'
    | 'y'
    | 'x'
    | 'b'
    | 'a'
    | 'r'
    | 'zr'
    | 'plus'
    | 'rightStick'
    | 'home'
  changed: boolean
  sameButtonCount: number
}

export type MoveEvent = BaseJoyConEvent & {
  type: 'move'
  direction?:
    | 'left'
    | 'right'
    | 'up'
    | 'down'
    | 'upLeft'
    | 'upRight'
    | 'downLeft'
    | 'downRight'
  move: Point2
  sameDirectionCount: number
}

export type AccelerationEvent = BaseJoyConEvent & {
  type: 'acceleration'
  angles: Angles
}

export type OrientationEvent = BaseJoyConEvent & {
  type: 'orientation'
  angles: Angles
}

export type BatteryEvent = BaseJoyConEvent & {
  type: 'battery'
  /** A value of 3 (full) to 0 (empty) */
  level: number
  charging: boolean
}

export type DeviceInfoEvent = BaseJoyConEvent & {
  type: 'deviceInfo'
  info: {
    firmwareVersion: {
      major: number
      minor: number
    }
    type: string
    macAddress: string
    spiColorInUse: Boolean
  }
}

/**
 * Filters out less button or joystick events over time, increasing the event velocity.
 *
 * @param count e.g. the sameDirectionCount or the sameButtonCount
 * @param acceleration value between 0...1
 * @param initialSpeed
 * @returns
 */
export const accelerationDebounced = (
  count: number,
  acceleration = 0.5,
  initialSpeed = 32,
) => {
  const speedLevel = Math.max(0, count ** clamp(acceleration, 0, 1) - 1)
  return count % Math.max(1, Math.round(initialSpeed / 2 ** speedLevel)) !== 0
}
