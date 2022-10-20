import { Point2 } from '../joy-con/madgwick'
import { Controller } from './interface'
// import { Angles, Point2 } from './madgwick'

type BaseMouseKeyboardEvent = {
  event: Event
}
export type MouseKeyboardEvent = ButtonEvent | JoyStickEvent

export type ButtonEvent = BaseMouseKeyboardEvent & {
  type: 'button'
  soloValue?:
    | 'down' // left, s
    | 'up' // right, w
    | 'right' // down, d
    | 'left' // up, a
    | 'stick' // mouse
    | 'bumperLeft' // q
    | 'bumperRight' // e
    | 'special' // 1
  value?: KeyboardEvent['key']
  changed: boolean
  sameButtonCount: number
}

export type JoyStickEvent = BaseMouseKeyboardEvent & {
  type: 'joyStick'
  direction?:
    | 'left'
    | 'right'
    | 'up'
    | 'down'
    | 'upLeft'
    | 'upRight'
    | 'downLeft'
    | 'downRight'
  value: Point2
  sameDirectionCount: number
}

export class MouseKeyboard implements Controller<ButtonEvent, JoyStickEvent> {
  ledstate: number = 0

  onButton?: (event: ButtonEvent) => void
  onJoystick?: (event: JoyStickEvent) => void

  private sameButtonCount: number = 0
  private sameDirectionCount: number = 0
  private lastValues: { key?: string; direction?: Direction } = {}
  get deviceName(): string {
    return 'Mouse-Keyboard'
  }

  buzz(): void {
    console.log('error')
  }

  constructor(public id: number, public window: Window) {}

  async open() {
    this.window.addEventListener('click', (event) => {
      this.onButton?.({
        event,
        type: 'button',
        value: 'mouse',
        soloValue: 'stick',
        changed: true,
        sameButtonCount: 0,
      })
    })
    this.window.addEventListener('keypress', (event) => {
      const changed = this.lastValues.key !== event.key
      this.sameButtonCount = changed ? 0 : this.sameButtonCount + 1
      console.log(this.lastValues.key, event.key, changed)
      this.lastValues.key = event.key
      this.onButton?.({
        event,
        type: 'button',
        value: event.key,
        soloValue: toSoloValue(event.key),
        changed,
        sameButtonCount: this.sameButtonCount,
      })
    })
    this.window.addEventListener('keyup', (event) => {
      const key = undefined
      const changed = this.lastValues.key !== key
      this.sameButtonCount = changed ? 0 : this.sameButtonCount + 1
      this.lastValues.key = key
      this.onButton?.({
        event,
        type: 'button',
        value: event.key,
        soloValue: toSoloValue(key),
        changed,
        sameButtonCount: this.sameButtonCount,
      })
    })
    this.window.addEventListener('mousemove', (event) => {
      const value = {
        x: event.movementX,
        y: event.movementY,
      }
      const direction = getDirection(value)
      this.sameDirectionCount =
        this.lastValues.direction === direction
          ? this.sameDirectionCount + 1
          : 0
      this.lastValues.direction = direction

      this.onJoystick?.({
        event,
        type: 'joyStick',
        value,
        direction,
        sameDirectionCount: this.sameDirectionCount,
      })
    })
  }
}

type Direction =
  | 'down'
  | 'up'
  | 'right'
  | 'left'
  | 'upLeft'
  | 'upRight'
  | 'downLeft'
  | 'downRight'
  | undefined

const threshold = 0.1

const toSoloValue = (value?: string): ButtonEvent['soloValue'] => {
  switch (value) {
    case 'w':
      return 'up'
    case 's':
      return 'down'
    case 'a':
      return 'left'
    case 'd':
      return 'right'
    case 'q':
      return 'bumperLeft'
    case 'e':
      return 'bumperRight'
    case '1':
      return 'special'
    default:
      return undefined
  }
}

const getDirection = (value: Point2): Direction => {
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
