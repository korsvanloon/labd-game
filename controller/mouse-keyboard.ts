import { dataUri } from './error-sound-data-uri'
import { Controller, PositionEvent } from './interface'
import { Point2 } from './joy-con/madgwick'

type BaseMouseKeyboardEvent = {
  event: Event
}
export type MouseKeyboardEvent = ButtonEvent | MouseEvent

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

export type MouseEvent = BaseMouseKeyboardEvent & {
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

export class MouseKeyboard implements Controller<ButtonEvent, MouseEvent> {
  ledstate: number = 0

  onButton?: (event: ButtonEvent) => void
  onMove?: (event: MouseEvent) => void
  onPosition?: (event: PositionEvent) => void

  private sameButtonCount: number = 0
  private sameDirectionCount: number = 0
  private lastValues: {
    key?: string
    direction?: Direction
    position: Point2
  } = {
    position: { x: 0, y: 0 },
  }
  get deviceName(): string {
    return 'Mouse-Keyboard'
  }

  buzz(): void {
    const snd = new Audio(dataUri)
    snd.volume = 0.5
    snd.play()
    console.error('bug!')
  }

  constructor(public id: number, public window: Window) {}

  async open() {
    this.window.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      this.onButton?.({
        event,
        type: 'button',
        value: 'mouse',
        soloValue: 'stick',
        changed: true,
        sameButtonCount: 0,
      })
    })
    this.window.addEventListener('click', (event) => {
      event.preventDefault()
      this.onButton?.({
        event,
        type: 'button',
        value: 'right',
        soloValue: 'right',
        changed: true,
        sameButtonCount: 0,
      })
    })

    this.window.addEventListener('keydown', (event) => {
      const changed = this.lastValues.key !== event.key
      this.sameButtonCount = changed ? 0 : this.sameButtonCount + 1
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

    this.window.document.addEventListener('mouseenter', (event) => {
      const position = { x: event.x + 5, y: event.y + 5 }

      this.onPosition?.({
        type: 'position',
        position,
      })
      this.lastValues.position = position
    })

    this.window.addEventListener('mousemove', (event) => {
      const position = { x: event.x + 5, y: event.y + 5 }
      const value = {
        x: position.x - this.lastValues.position.x,
        y: position.y - this.lastValues.position.y,
      }
      const direction = getDirection(value)
      this.sameDirectionCount =
        this.lastValues.direction === direction
          ? this.sameDirectionCount + 1
          : 0
      this.onPosition?.({
        type: 'position',
        position,
      })
      this.onMove?.({
        event,
        type: 'move',
        move: value,
        direction,
        sameDirectionCount: this.sameDirectionCount,
      })
      this.lastValues.direction = direction
      this.lastValues.position = position
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
    case 'ArrowUp':
    case 'w':
      return 'up'
    case 'ArrowDown':
    case 's':
      return 'down'
    case 'ArrowLeft':
    case 'a':
      return 'left'
    case 'ArrowRight':
    case 'd':
      return 'right'
    case 'Space':
    case 'q':
      return 'bumperLeft'
    case 'Shift':
    case 'e':
      return 'bumperRight'
    case 'Escape':
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
