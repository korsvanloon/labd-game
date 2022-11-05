'use client'
import clsx from 'clsx'
import { HTMLAttributes } from 'react'
import { JoyCon } from '../controller/joy-con/joycon'
import { MouseKeyboard } from '../controller/mouse-keyboard'
import { useControllers } from '../hooks/useControllers'
import IconJoyCon from '../public/icon-joycon.svg'
import IconKeyboard from '../public/icon-keyboard.svg'

export type Styles = {
  button: { primary?: string }
  controller: { root?: string }
}

type Props = {
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export const ControllerButtons = ({ styles, ...attributes }: Props) => {
  const {
    controllers,
    connectJoyCon,
    connectMouseKeyboard,
    disconnectMouseKeyboard,
  } = useControllers()

  const hasMouseKeyboard = controllers.some((c) => c instanceof MouseKeyboard)

  return (
    <div {...attributes} className={clsx(styles.controller.root)}>
      <button
        className={clsx(styles.button.primary)}
        type="button"
        onClick={connectJoyCon}
        disabled={controllers.filter((c) => c instanceof JoyCon).length === 2}
      >
        <span>Connect Joy-Con</span>
        <IconJoyCon />
      </button>
      <button
        className={clsx(styles.button.primary)}
        type="button"
        onClick={() =>
          hasMouseKeyboard ? disconnectMouseKeyboard() : connectMouseKeyboard()
        }
      >
        {hasMouseKeyboard ? (
          <span>Disconnect Mouse-Keyboard</span>
        ) : (
          <span>Connect Mouse-Keyboard</span>
        )}
        <IconKeyboard />
      </button>
    </div>
  )
}
