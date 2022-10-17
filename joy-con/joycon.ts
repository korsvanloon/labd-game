import { connectRingCon } from './connectRingCon'
import {
  AccelerationEvent,
  BatteryEvent,
  ButtonEvent,
  DeviceInfoEvent,
  JoyStickEvent,
  OrientationEvent,
} from './events'
import { Angles, Point2 } from './madgwick'
import { createPacket } from './packet'

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

/**
 * Concatenates two typed arrays.
 */
const concatTypedArrays = (a: Uint8Array, b: Uint8Array): Uint8Array => {
  const c = new Uint8Array(a.length + b.length)
  c.set(a, 0)
  c.set(b, a.length)
  return c
}

const subCommandHeader = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
const vibrationHeader = [0x00, 0x00, 0x01, 0x40, 0x40, 0x00, 0x01, 0x40, 0x40]

export class JoyCon {
  ledstate: number = 0

  onButton?: (event: ButtonEvent) => void
  onJoystick?: (event: JoyStickEvent) => void
  onAccelerationChange?: (event: AccelerationEvent) => void
  onOrientationChange?: (event: OrientationEvent) => void
  onDeviceInfo?: (event: DeviceInfoEvent) => void
  onBatteryChange?: (event: BatteryEvent) => void

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

  /**
   * Opens the device.
   */
  async open() {
    if (!this.device.opened) {
      await this.device.open()
    }
    this.device.addEventListener('inputreport', this._onInputReport.bind(this))
  }

  /**
   * Requests information about the device.
   */
  async requestDeviceInfo() {
    const outputReportID = 0x01
    const subcommand = [0x02]
    const data = [...subCommandHeader, ...subcommand]
    await this.device.sendReport(outputReportID, new Uint8Array(data))
  }

  /**
   * Requests information about the battery.
   */
  async requestBatteryLevel() {
    const outputReportID = 0x01
    const subCommand = [0x50]
    const data = [...subCommandHeader, ...subCommand]
    await this.device.sendReport(outputReportID, new Uint8Array(data))
  }

  /**
   * Enables simple HID mode.
   */
  async enableSimpleHIDMode() {
    const outputReportID = 0x01
    const subcommand = [0x03, 0x3f]
    const data = [...subCommandHeader, ...subcommand]
    await this.device.sendReport(outputReportID, new Uint8Array(data))
  }

  /**
   * Enables standard full mode.
   */
  async enableStandardFullMode() {
    const outputReportID = 0x01
    const subcommand = [0x03, 0x30]
    const data = [...subCommandHeader, ...subcommand]
    await this.device.sendReport(outputReportID, new Uint8Array(data))
  }

  /**
   * Enables EMU mode.
   */
  async enableIMUMode() {
    const outputReportID = 0x01
    const subcommand = [0x40, 0x01]
    const data = [...subCommandHeader, ...subcommand]
    await this.device.sendReport(outputReportID, new Uint8Array(data))
  }

  /**
   * Disables IMU mode.
   */
  async disableIMUMode() {
    const outputReportID = 0x01
    const subcommand = [0x40, 0x00]
    const data = [...subCommandHeader, ...subcommand]
    await this.device.sendReport(outputReportID, new Uint8Array(data))
  }

  /**
   * Enables vibration.
   */
  async enableVibration() {
    const outputReportID = 0x01
    const subcommand = [0x48, 0x01]
    const data = [...vibrationHeader, ...subcommand]
    await this.device.sendReport(outputReportID, new Uint8Array(data))
  }

  /**
   * Disables vibration.
   */
  async disableVibration() {
    const outputReportID = 0x01
    const subcommand = [0x48, 0x00]
    const data = [...vibrationHeader, ...subcommand]
    await this.device.sendReport(outputReportID, new Uint8Array(data))
  }

  /**
   * Enables RingCon.
   * @seeAlso https://github.com/mascii/demo-of-ring-con-with-web-hid
   */
  async enableRingCon() {
    /*
    const cmds = [
      [0x22, 0x01], // enabling_MCU_data_22_1
      [0x21, 0x21, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF3
      ], // enabling_MCU_data_21_21_1_1
      [0x59], // get_ext_data_59
      [0x5C, 0x06, 0x03, 0x25, 0x06, 0x00, 0x00, 0x00, 0x00, 0x1C, 0x16, 0xED, 0x34, 0x36,
        0x00, 0x00, 0x00, 0x0A, 0x64, 0x0B, 0xE6, 0xA9, 0x22, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x90, 0xA8, 0xE1, 0x34, 0x36
      ], // get_ext_dev_in_format_config_5C
      [0x5A, 0x04, 0x01, 0x01, 0x02], // start_external_polling_5A
    ];
    for (const subcommand of cmds) {
      await this.device.sendReport(0x01, new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, ...subcommand
      ]));
    }
    */
    await connectRingCon(this.device)
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
   * set LED state.
   *
   * @param {int} n position(0-3)
   */
  async setLEDState(n: number) {
    const NO_RUMBLE = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
    const subcommand = [0x30, n]
    await this.device.sendReport(
      0x01,
      new Uint8Array([...NO_RUMBLE, 0, ...subcommand]),
    )
  }

  /**
   * set LED.
   *
   * @param n position(0-3)
   */
  async setLED(n: number) {
    this.ledstate |= 1 << n
    await this.setLEDState(this.ledstate)
  }

  /**
   * reset LED.
   *
   * @param n position(0-3)
   */
  async resetLED(n: number) {
    this.ledstate &= ~((1 << n) | (1 << (4 + n)))
    await this.setLEDState(this.ledstate)
  }

  /**
   * blink LED.
   *
   * @param n position(0-3)
   */
  async blinkLED(n: number) {
    this.ledstate &= ~(1 << n)
    this.ledstate |= 1 << (4 + n)
    await this.setLEDState(this.ledstate)
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
          type: 'battery',
          ...packet.batteryLevel,
        })
      }
    }
    if (packet.type === 'full_mode' && this.lastPacket?.type === 'full_mode') {
      const buttonValue = Object.entries(packet.buttonStatus).find(
        ([, v]) => v,
      )?.[0] as ButtonEvent['value']

      const lastButtonValue = Object.entries(this.lastPacket.buttonStatus).find(
        ([, v]) => v,
      )?.[0] as ButtonEvent['value']

      if (!this.lastPacket || buttonValue || lastButtonValue) {
        const changed = buttonValue !== lastButtonValue
        this.sameButtonCount = changed ? 0 : this.sameButtonCount + 1

        this.onButton?.({
          controller: this,
          type: 'button',
          value: buttonValue,
          soloValue: toSoloValue(buttonValue),
          changed,
          sameButtonCount: this.sameButtonCount,
        })
      }

      const stickValue = packet.analogStickLeft
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
        stickValue &&
        (Math.abs(stickValue.x) > threshold ||
          Math.abs(stickValue.y) > threshold)
      ) {
        const direction = getDirection(stickValue)
        const lastDirection = lastsStickValue
          ? getDirection(lastsStickValue)
          : undefined
        const changed = direction !== lastDirection

        this.sameDirectionCount = changed ? 0 : this.sameDirectionCount + 1

        this.onJoystick?.({
          controller: this,
          type: 'joyStick',
          value: stickValue,
          direction: getDirection(stickValue),
          sameDirectionCount: this.sameDirectionCount,
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
