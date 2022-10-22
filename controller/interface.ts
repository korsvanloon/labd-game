import { Point2 } from '../joy-con/madgwick'

export interface ButtonEvent {
  type: 'button'
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
  position: Point2
}

export interface Controller<
  B extends ButtonEvent = ButtonEvent,
  J extends MoveEvent = MoveEvent,
> {
  id: number
  get deviceName(): string
  buzz(): void
  onButton?: (event: B) => void
  onMove?: (event: J) => void
  onPosition?: (event: PositionEvent) => void
}
