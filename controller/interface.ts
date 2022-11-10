import { Point2 } from './joy-con/madgwick'

export interface ButtonEvent {
  type: 'button'
  controllerId: number
  soloValue?: SoloButton
  changed: boolean
  sameButtonCount: number
}

export type SoloButton =
  | 'down'
  | 'up'
  | 'right'
  | 'left'
  | 'stick'
  | 'bumperLeft'
  | 'bumperRight'
  | 'special'

export interface MoveEvent {
  type: 'move'
  controllerId: number
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

export interface PositionEvent {
  type: 'position'
  controllerId: number
  position: Point2
}

export interface Controller<
  Context = any,
  B extends ButtonEvent = ButtonEvent,
  J extends MoveEvent = MoveEvent,
> {
  id: number
  get deviceName(): string
  get initialPosition(): Point2
  context?: Context
  open(): Promise<void>
  close(): Promise<void>
  buzz(): void
  onButton?: (event: B) => void
  onMove?: (event: J) => void
  onPosition?: (event: PositionEvent) => void
  addButtonListener: (context: Context, callback: (event: B) => void) => void
  addMoveListener: (context: Context, callback: (event: J) => void) => void
  addPositionListener: (
    context: Context,
    callback: (event: PositionEvent) => void,
  ) => void
  removeButtonListener: (callback: (event: B) => void) => void
  removeMoveListener: (callback: (event: J) => void) => void
  removePositionListener: (callback: (event: PositionEvent) => void) => void
}
