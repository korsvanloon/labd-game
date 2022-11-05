import { dataUri } from './error-sound-data-uri'
import { Controller, PositionEvent } from './interface'
import { Point2 } from './joy-con/madgwick'

type BaseMouseKeyboardEvent = {
  event: Event
}
export type MouseKeyboardEvent = ButtonEvent | MoveEvent

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

export type MoveEvent = BaseMouseKeyboardEvent & {
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

export class MouseKeyboard implements Controller<ButtonEvent, MoveEvent> {
  ledstate: number = 0

  onButton?: (event: ButtonEvent) => void
  onMove?: (event: MoveEvent) => void
  onPosition?: (event: PositionEvent) => void

  private sameButtonCount: number = 0
  private sameDirectionCount: number = 0
  private lastValues: {
    key?: string
    direction?: Direction
    position: Point2
  } = {
    position: this.initialPosition,
  }
  get deviceName(): string {
    return 'Mouse-Keyboard'
  }

  get initialPosition(): Point2 {
    return { x: 0, y: 0 }
  }

  constructor(public id: number, public window: Window) {}

  buzz(): void {
    const snd = new Audio(dataUri)
    snd.volume = 0.5
    snd.play()
    console.error('bug!')
  }

  async open() {
    this.window.addEventListener('contextmenu', this.onContextMenu)
    this.window.addEventListener('click', this.onClick)
    this.window.addEventListener('keydown', this.onKeydown)
    this.window.addEventListener('keyup', this.onKeyup)
    this.window.document.addEventListener('mouseenter', this.onMouseEnter)
    this.window.addEventListener('mousemove', this.onMouseMove)

    this.onPosition?.({
      type: 'position',
      position: this.initialPosition,
    })
  }
  async close() {
    const x = () => {}
    this.window.addEventListener('contextmenu', this.onContextMenu)
    this.window.addEventListener('click', this.onClick)
    this.window.addEventListener('keydown', this.onKeydown)
    this.window.addEventListener('keyup', this.onKeyup)
    this.window.addEventListener('mousemove', this.onMouseMove)
    this.window.document.addEventListener('mouseenter', this.onMouseEnter)
  }

  private onContextMenu = (event: MouseEvent) => {
    event.preventDefault()
    this.onButton?.({
      event,
      type: 'button',
      value: 'mouse',
      soloValue: 'stick',
      changed: true,
      sameButtonCount: 0,
    })
  }
  private onClick = (event: MouseEvent) => {
    event.preventDefault()
    this.onButton?.({
      event,
      type: 'button',
      value: 'right',
      soloValue: 'right',
      changed: true,
      sameButtonCount: 0,
    })
  }
  private onMouseEnter = (event: MouseEvent) => {
    const position = { x: event.x + 5, y: event.y + 5 }

    this.onPosition?.({
      type: 'position',
      position,
    })
    this.lastValues.position = position
  }
  private onMouseMove = (event: MouseEvent) => {
    const position = { x: event.x + 5, y: event.y + 10 }
    const value = {
      x: position.x - this.lastValues.position.x,
      y: position.y - this.lastValues.position.y,
    }
    const direction = getDirection(value)
    this.sameDirectionCount =
      this.lastValues.direction === direction ? this.sameDirectionCount + 1 : 0
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
  }
  private onKeydown = (event: KeyboardEvent) => {
    const changed = this.lastValues.key !== event.key
    this.sameButtonCount = changed ? 0 : this.sameButtonCount + 1
    this.lastValues.key = event.key
    const soloValue = toSoloValue(event.key)
    if (!soloValue) return
    this.onButton?.({
      event,
      type: 'button',
      value: event.key,
      soloValue,
      changed,
      sameButtonCount: this.sameButtonCount,
    })
  }
  private onKeyup = (event: KeyboardEvent) => {
    const changed = Boolean(this.lastValues.key)
    this.sameButtonCount = changed ? 0 : this.sameButtonCount + 1
    this.lastValues.key = undefined
    this.onButton?.({
      event,
      type: 'button',
      changed,
      sameButtonCount: this.sameButtonCount,
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
    case 'q':
      return 'bumperLeft'
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
