import { Point2 } from '../joy-con/madgwick'

export interface ButtonEvent {
  type: 'button'
  soloValue?:
    | 'down'
    | 'up'
    | 'right'
    | 'left'
    | 'stick'
    | 'bumperLeft'
    | 'bumperRight'
    | 'special'
  changed: boolean
  sameButtonCount: number
}

export interface JoyStickEvent {
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

export interface Controller<
  B extends ButtonEvent = ButtonEvent,
  J extends JoyStickEvent = JoyStickEvent,
> {
  id: number
  get deviceName(): string
  buzz(): void
  onButton?: (event: B) => void
  onJoystick?: (event: J) => void
}
