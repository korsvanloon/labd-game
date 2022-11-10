import { clamp } from '../../util/math'
import { Controller, PositionEvent } from '../interface'
import { connectRingCon } from './connectRingCon'
import {
  accelerationDebounced,
  AccelerationEvent,
  BatteryEvent,
  ButtonEvent,
  DeviceInfoEvent,
  MoveEvent,
  OrientationEvent,
} from './events'
import { Angles, Point2 } from './madgwick'
import { createPacket } from './packet'

/**
 * Concatenates two typed arrays.
 */
const concatTypedArrays = (a: Uint8Array, b: Uint8Array): Uint8Array => {
  const c = new Uint8Array(a.length + b.length)
  c.set(a, 0)
  c.set(b, a.length)
  return c
}

const SUB_COMMAND = {
  REPORT_ID: 0x01,
  HEADER: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
}
const RUMBLE_HEADER = [0x00, 0x00, 0x01, 0x40, 0x40, 0x00, 0x01, 0x40, 0x40]

export class JoyCon<Context = any>
  implements Controller<Context, ButtonEvent, MoveEvent>
{
  context?: Context
  onButton?: (event: ButtonEvent) => void
  onMove?: (event: MoveEvent) => void
  onAccelerationChange?: (event: AccelerationEvent) => void
  onOrientationChange?: (event: OrientationEvent) => void
  onDeviceInfo?: (event: DeviceInfoEvent) => void
  onBatteryChange?: (event: BatteryEvent) => void
  get deviceName(): string {
    return this.device.productName
  }
  get initialPosition(): Point2 {
    return { x: 0, y: 0 }
  }
  buzz(): void {
    this.rumble(0, 0, 0.9)
  }
  private ledState: number = 0
  private lastPacket?: ReturnType<typeof createPacket>
  private lastEulerAngles: Angles = {
    alpha: 0,
    beta: 0,
    gamma: 0,
  }
  private lastTimestamp?: number
  private sameButtonCount: number = 0
  private sameDirectionCount: number = 0

  constructor(public id: number, public device: HIDDevice) {}
  onPosition?: ((event: PositionEvent) => void) | undefined
  private buttonListeners: {
    context: Context
    callback: (event: ButtonEvent) => void
  }[] = []
  private moveListeners: {
    context: Context
    callback: (event: MoveEvent) => void
  }[] = []
  private positionListeners: {
    context: Context
    callback: (event: PositionEvent) => void
  }[] = []
  addButtonListener(context: Context, callback: (event: ButtonEvent) => void) {
    this.buttonListeners.push({ context, callback })
  }
  addMoveListener(context: Context, callback: (event: MoveEvent) => void) {
    this.moveListeners.push({ context, callback })
  }
  addPositionListener(
    context: Context,
    callback: (event: PositionEvent) => void,
  ) {
    this.positionListeners.push({ context, callback })
  }
  removeButtonListener(callback: (event: ButtonEvent) => void) {
    this.buttonListeners.splice(
      this.buttonListeners.findIndex((event) => event.callback === callback),
      1,
    )
  }
  removeMoveListener(callback: (event: MoveEvent) => void) {
    this.moveListeners.splice(
      this.moveListeners.findIndex((event) => event.callback === callback),
      1,
    )
  }
  removePositionListener(callback: (event: PositionEvent) => void) {
    this.positionListeners.splice(
      this.positionListeners.findIndex((event) => event.callback === callback),
      1,
    )
  }

  /**
   * Opens the device.
   */
  async open() {
    if (!this.device.opened) {
      await this.device.open()
    }
    this.device.addEventListener('inputreport', this._onInputReport.bind(this))
  }
  async close() {
    if (this.device.opened) {
      await this.device.close()
    }
  }

  private sendSubCommand(subCommand: number[]) {
    return this.device.sendReport(
      SUB_COMMAND.REPORT_ID,
      new Uint8Array([...SUB_COMMAND.HEADER, ...subCommand]),
    )
  }

  /**
   * Requests information about the device.
   */
  requestDeviceInfo() {
    return this.sendSubCommand([0x02])
  }

  /**
   * Requests information about the battery.
   */
  requestBatteryLevel() {
    return this.sendSubCommand([0x50])
  }

  /**
   * Enables simple HID mode.
   */
  enableSimpleHIDMode() {
    return this.sendSubCommand([0x03, 0x3f])
  }

  /**
   * Enables standard full mode.
   */
  enableStandardFullMode() {
    return this.sendSubCommand([0x03, 0x30])
  }

  /**
   * Enables EMU mode.
   */
  enableIMUMode() {
    return this.sendSubCommand([0x40, 0x01])
  }

  /**
   * Disables IMU mode.
   */
  disableIMUMode() {
    return this.sendSubCommand([0x40, 0x00])
  }

  /**
   * Enables vibration.
   */
  enableVibration() {
    return this.sendSubCommand([0x48, 0x01])
  }

  /**
   * Disables vibration.
   */
  disableVibration() {
    return this.sendSubCommand([0x48, 0x00])
  }

  /**
   * Enables RingCon.
   * @seeAlso https://github.com/mascii/demo-of-ring-con-with-web-hid
   */
  enableRingCon() {
    return connectRingCon(this.device)
  }

  /**
   * Enables USB HID Joystick report
   */
  async enableUSBHIDJoystickReport() {
    const usb = this.device.collections[0].outputReports?.some(
      (r) => r.reportId == 0x80,
    )
    if (usb) {
      await this.device.sendReport(0x80, new Uint8Array([0x01]))
      await this.device.sendReport(0x80, new Uint8Array([0x02]))
      await this.device.sendReport(0x01, new Uint8Array([0x03]))
      await this.device.sendReport(0x80, new Uint8Array([0x04]))
    }
  }

  /**
   * Send a rumble signal to Joy-Con.
   *
   * @param lowFrequency a number between 40.875885 and 626.286133
   * @param highFrequency a number between 81.75177, 1252.572266
   * @param amplitude a number between 0 and 1
   */
  async rumble(lowFrequency: number, highFrequency: number, amplitude: number) {
    const outputReportID = 0x10
    const data = new Uint8Array(9)

    // Referenced codes below:
    // https://github.com/Looking-Glass/JoyconLib/blob/master/Packages/com.lookingglass.joyconlib/JoyconLib_scripts/Joycon.cs
    data[0] = 0x00

    let lf = clamp(lowFrequency, 40.875885, 626.286133)
    let hf = clamp(highFrequency, 81.75177, 1252.572266)

    hf = (Math.round(32 * Math.log2(hf * 0.1)) - 0x60) * 4
    lf = Math.round(32 * Math.log2(lf * 0.1)) - 0x40

    const amp = clamp(amplitude, 0, 1)

    let hfAmp
    if (amp == 0) {
      hfAmp = 0
    } else if (amp < 0.117) {
      hfAmp = (Math.log2(amp * 1000) * 32 - 0x60) / (5 - Math.pow(amp, 2)) - 1
    } else if (amp < 0.23) {
      hfAmp = Math.log2(amp * 1000) * 32 - 0x60 - 0x5c
    } else {
      hfAmp = (Math.log2(amp * 1000) * 32 - 0x60) * 2 - 0xf6
    }

    let lfAmp = Math.round(hfAmp) * 0.5
    const parity = lfAmp % 2
    if (parity > 0) {
      --lfAmp
    }
    lfAmp = lfAmp >> 1
    lfAmp += 0x40
    if (parity > 0) {
      lfAmp |= 0x8000
    }

    data[1] = hf & 0xff
    data[2] = hfAmp + ((hf >>> 8) & 0xff)
    data[3] = lf + ((lfAmp >>> 8) & 0xff)
    data[4] += lfAmp & 0xff

    for (let i = 0; i < 4; i++) {
      data[5 + i] = data[1 + i]
    }

    await this.device.sendReport(outputReportID, new Uint8Array(data))
  }

  /**
   * Set LED state in bit format.
   *
   * E.g. an int `state` of 9 translates to `0b1001` in binary,
   * meaning the first and the last of the four LEDs are on,
   * and the middle 2 are off.
   *
   * @param {int} state 0...15 (or 0b0000...0b1111 )
   */
  setLEDState(state: number) {
    this.ledState = state
    return this.sendSubCommand([0x30, state])
  }

  /**
   * set LED.
   *
   * @param position 0...3
   */
  setLED(position: number) {
    return this.setLEDState(this.ledState | (1 << position))
  }

  /**
   * reset LED.
   *
   * @param position 0...3
   */
  resetLED(position: number) {
    return this.setLEDState(
      this.ledState & ~((1 << position) | (1 << (4 + position))),
    )
  }

  /**
   * blink LED.
   *
   * @param position 0..3
   */
  async blinkLED(position: number) {
    this.ledState &= ~(1 << position)
    this.ledState |= 1 << (4 + position)
    await this.setLEDState(this.ledState)
  }

  /**
   * Deal with `oninputreport` events.
   */
  _onInputReport(event: HIDInputReportEvent) {
    if (!event.data) {
      return
    }

    const data = concatTypedArrays(
      new Uint8Array([event.reportId]),
      new Uint8Array(event.data.buffer),
    )

    const packet = createPacket(
      event.reportId,
      event.device.productId,
      data,
      this.lastEulerAngles,
      this.lastTimestamp,
    )
    this.lastTimestamp = Date.now()

    if (packet.type === 'sub_command') {
      if (packet.deviceInfo) {
        this.onDeviceInfo?.({
          controller: this,
          controllerId: this.id,
          type: 'deviceInfo',
          info: packet.deviceInfo,
        })
      }
    }
    const isEqual = (obj1: object, obj2: object) =>
      JSON.stringify(obj1) === JSON.stringify(obj2)

    if (
      packet.type !== 'unknown' &&
      this.lastPacket &&
      this.lastPacket?.type !== 'unknown'
    ) {
      if (!isEqual(packet.batteryLevel, this.lastPacket.batteryLevel)) {
        this.onBatteryChange?.({
          controller: this,
          controllerId: this.id,

          type: 'battery',
          ...packet.batteryLevel,
        })
      }
    }
    if (packet.type === 'full_mode' && this.lastPacket?.type === 'full_mode') {
      const value = Object.entries(packet.buttonStatus).find(
        ([, v]) => v,
      )?.[0] as ButtonEvent['value']

      const lastButtonValue = Object.entries(this.lastPacket.buttonStatus).find(
        ([, v]) => v,
      )?.[0] as ButtonEvent['value']

      if (!this.lastPacket || value || lastButtonValue) {
        const changed = value !== lastButtonValue
        this.sameButtonCount = changed ? 0 : this.sameButtonCount + 1

        const soloValue = toSoloValue(value)

        if (!accelerationDebounced(this.sameButtonCount)) {
          this.onButton?.({
            controller: this,
            controllerId: this.id,
            type: 'button',
            value,
            soloValue,
            changed,
            sameButtonCount: this.sameButtonCount,
          })
          this.buttonListeners
            .filter((l) => l.context === this.context)
            .forEach((l) =>
              l.callback({
                controller: this,
                type: 'button',
                controllerId: this.id,
                value,
                soloValue,
                changed,
                sameButtonCount: this.sameButtonCount,
              }),
            )
        }
      }

      const move = packet.analogStickLeft
        ? toJoyConDirectionValue(packet.analogStickLeft, 'left')
        : packet.analogStickRight
        ? toJoyConDirectionValue(packet.analogStickRight, 'right')
        : undefined
      const lastsStickValue = this.lastPacket.analogStickLeft
        ? toJoyConDirectionValue(this.lastPacket.analogStickLeft, 'left')
        : this.lastPacket.analogStickRight
        ? toJoyConDirectionValue(this.lastPacket.analogStickRight, 'right')
        : undefined

      if (
        move &&
        (Math.abs(move.x) > threshold || Math.abs(move.y) > threshold)
      ) {
        const direction = getDirection(move)
        const lastDirection = lastsStickValue
          ? getDirection(lastsStickValue)
          : undefined
        const changed = direction !== lastDirection

        this.sameDirectionCount = changed ? 0 : this.sameDirectionCount + 1

        this.onMove?.({
          controller: this,
          controllerId: this.id,
          type: 'move',
          move,
          direction,
          sameDirectionCount: this.sameDirectionCount,
        })
        this.moveListeners
          .filter((l) => l.context === this.context)
          .forEach((l) => {
            return l.callback({
              controller: this,
              type: 'move',
              controllerId: this.id,
              move,
              direction,
              sameDirectionCount: this.sameDirectionCount,
            })
          })
      }
    }
    this.lastPacket = packet
  }
}

function toSoloValue(
  value?: string,
):
  | 'down'
  | 'up'
  | 'right'
  | 'left'
  | 'stick'
  | 'bumperLeft'
  | 'bumperRight'
  | 'special'
  | undefined {
  switch (value) {
    case 'left':
    case 'a':
      return 'down'
    case 'right':
    case 'y':
      return 'up'
    case 'down':
    case 'x':
      return 'right'
    case 'up':
    case 'b':
      return 'left'
    case 'leftStick':
    case 'rightStick':
      return 'stick'
    case 'sl':
      return 'bumperLeft'
    case 'sr':
      return 'bumperRight'
    case 'minus':
    case 'plus':
      return 'special'
    default:
      return undefined
  }
}

const threshold = 0.2

const toJoyConDirectionValue = (
  value: { horizontal: string; vertical: string },
  joyCon: 'left' | 'right',
) => {
  if (joyCon === 'left') {
    return {
      x: +value.vertical,
      y: -value.horizontal,
    }
  }
  return {
    x: -value.vertical,
    y: +value.horizontal,
  }
}

const getDirection = (
  value: Point2,
):
  | 'down'
  | 'up'
  | 'right'
  | 'left'
  | 'upLeft'
  | 'upRight'
  | 'downLeft'
  | 'downRight'
  | undefined => {
  if (Math.abs(value.x) < threshold && Math.abs(value.y) < threshold) {
    return undefined
  }
  if (value.x < -threshold) {
    if (value.y < -threshold) {
      return 'upLeft'
    }
    if (value.y > threshold) {
      return 'downLeft'
    }
    return 'left'
  }
  if (value.x > threshold) {
    if (value.y < -threshold) {
      return 'upRight'
    }
    if (value.y > threshold) {
      return 'downRight'
    }
    return 'right'
  }
  if (value.y < -threshold) {
    return 'up'
  }
  if (value.y > threshold) {
    return 'down'
  }
}
