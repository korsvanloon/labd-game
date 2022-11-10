import { dataUri } from './error-sound-data-uri'
import { Controller, PositionEvent } from './interface'
import { Point2 } from './joy-con/madgwick'

type BaseMouseKeyboardEvent = {
  controllerId: number
}
export type MouseKeyboardEvent = ButtonEvent | MoveEvent

export type ButtonEvent = BaseMouseKeyboardEvent & {
  type: 'button'
  // event: Event

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
  // event: Event

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

export class MouseKeyboard<Context = any>
  implements Controller<Context, ButtonEvent, MoveEvent>
{
  context?: Context

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
      controllerId: this.id,
      position: this.initialPosition,
    })
    this.positionListeners
      .filter((l) => l.context === this.context)
      .forEach((l) =>
        l.callback({
          type: 'position',
          controllerId: this.id,
          position: this.initialPosition,
        }),
      )
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
      // event,
      type: 'button',
      controllerId: this.id,
      value: 'mouse',
      soloValue: 'stick',
      changed: true,
      sameButtonCount: 0,
    })
    this.buttonListeners
      .filter((l) => l.context === this.context)
      .forEach((l) =>
        l.callback({
          // event,
          type: 'button',
          controllerId: this.id,
          value: 'mouse',
          soloValue: 'stick',
          changed: true,
          sameButtonCount: 0,
        }),
      )
    // this.context.dispatchEvent(
    //   new CustomEvent('controller-button', {
    //     detail: {
    //       controllerId: this.id,
    //       value: 'mouse',
    //       soloValue: 'stick',
    //       changed: true,
    //       sameButtonCount: 0,
    //     },
    //   }),
    // )
  }
  private onClick = (event: MouseEvent) => {
    event.preventDefault()
    this.onButton?.({
      // event,
      type: 'button',
      controllerId: this.id,
      value: 'right',
      soloValue: 'right',
      changed: true,
      sameButtonCount: 0,
    })
    this.buttonListeners
      .filter((l) => l.context === this.context)
      .forEach((l) =>
        l.callback({
          // event,
          type: 'button',
          controllerId: this.id,
          value: 'right',
          soloValue: 'right',
          changed: true,
          sameButtonCount: 0,
        }),
      )
    // this.context.dispatchEvent(
    //   new CustomEvent('controller-button', {
    //     detail: {
    //       controllerId: this.id,
    //       value: 'right',
    //       soloValue: 'right',
    //       changed: true,
    //       sameButtonCount: 0,
    //     },
    //   }),
    // )
  }
  private onMouseEnter = (event: MouseEvent) => {
    const position = { x: event.x + 5, y: event.y + 5 }

    this.onPosition?.({
      type: 'position',
      controllerId: this.id,
      position,
    })
    this.lastValues.position = position
    this.positionListeners
      .filter((l) => l.context === this.context)
      .forEach((l) =>
        l.callback({
          type: 'position',
          controllerId: this.id,
          position,
        }),
      )
    // this.context.dispatchEvent(
    //   new CustomEvent('controller-position', {
    //     detail: {
    //       controllerId: this.id,
    //       position,
    //     },
    //   }),
    // )
  }
  private onMouseMove = (event: MouseEvent) => {
    const position = { x: event.x + 5, y: event.y + 10 }
    const value = {
      x: position.x - this.lastValues.position.x,
      y: position.y - this.lastValues.position.y,
    }
    this.onPosition?.({
      type: 'position',
      controllerId: this.id,
      position,
    })
    this.positionListeners
      .filter((l) => l.context === this.context)
      .forEach((l) =>
        l.callback({
          type: 'position',
          controllerId: this.id,
          position,
        }),
      )

    const direction = getDirection(value)
    this.sameDirectionCount =
      this.lastValues.direction === direction ? this.sameDirectionCount + 1 : 0

    if (!direction) return

    this.onMove?.({
      // event,
      type: 'move',
      controllerId: this.id,
      move: value,
      direction,
      sameDirectionCount: this.sameDirectionCount,
    })
    this.moveListeners
      .filter((l) => l.context === this.context)
      .forEach((l) =>
        l.callback({
          // event,
          type: 'move',
          controllerId: this.id,
          move: value,
          direction,
          sameDirectionCount: this.sameDirectionCount,
        }),
      )

    this.lastValues.direction = direction
    this.lastValues.position = position

    // this.context.dispatchEvent(
    //   new CustomEvent('controller-position', {
    //     detail: {
    //       controllerId: this.id,
    //       position,
    //     },
    //   }),
    // )
    // this.context.dispatchEvent(
    //   new CustomEvent('controller-move', {
    //     detail: {
    //       controllerId: this.id,
    //       move: value,
    //       direction,
    //       sameDirectionCount: this.sameDirectionCount,
    //     },
    //   }),
    // )
  }
  private onKeydown = (event: KeyboardEvent) => {
    const changed = this.lastValues.key !== event.key
    this.sameButtonCount = changed ? 0 : this.sameButtonCount + 1
    this.lastValues.key = event.key
    const soloValue = toSoloValue(event.key)
    if (!soloValue) return
    this.onButton?.({
      // event,
      type: 'button',
      controllerId: this.id,
      value: event.key,
      soloValue,
      changed,
      sameButtonCount: this.sameButtonCount,
    })
    this.buttonListeners
      .filter((l) => l.context === this.context)
      .forEach((l) =>
        l.callback({
          // event,
          type: 'button',
          controllerId: this.id,
          value: event.key,
          soloValue,
          changed,
          sameButtonCount: this.sameButtonCount,
        }),
      )
    // this.context.dispatchEvent(
    //   new CustomEvent('controller-button', {
    //     detail: {
    //       value: event.key,
    //       controllerId: this.id,
    //       soloValue,
    //       changed,
    //       sameButtonCount: this.sameButtonCount,
    //     },
    //   }),
    // )
  }
  private onKeyup = (event: KeyboardEvent) => {
    const changed = Boolean(this.lastValues.key)
    this.sameButtonCount = changed ? 0 : this.sameButtonCount + 1
    this.lastValues.key = undefined
    if (!keys.includes(event.key)) return

    this.onButton?.({
      // event,
      type: 'button',
      controllerId: this.id,
      changed,
      sameButtonCount: this.sameButtonCount,
    })
    this.buttonListeners
      .filter((l) => l.context === this.context)
      .forEach((l) =>
        l.callback({
          // event,
          type: 'button',
          controllerId: this.id,
          changed,
          sameButtonCount: this.sameButtonCount,
        }),
      )
    // this.context.dispatchEvent(
    //   new CustomEvent('controller-button', {
    //     detail: {
    //       controllerId: this.id,
    //       changed,
    //       sameButtonCount: this.sameButtonCount,
    //     },
    //   }),
    // )
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

const keys = [
  'ArrowUp',
  'w',
  'ArrowDown',
  's',
  'ArrowLeft',
  'a',
  'ArrowRight',
  'd',
  'q',
  'e',
  'Escape',
  '1',
]

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
