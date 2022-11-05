import { useEffect, useState } from 'react'
import { Controller } from '../controller/interface'
import { JoyConConnection, requestJoyCon } from '../controller/joy-con'
import { JoyCon } from '../controller/joy-con/joycon'
import { MouseKeyboard } from '../controller/mouse-keyboard'

const MOUSE_KEYBOARD = 'mouse-keyboard'

export const useControllers = () => {
  const [controllers, setControllers] = useState<Controller[]>([])

  useEffect(() => {
    JoyConConnection({
      onChangeControllers: (joyCons) =>
        setControllers((cs) => {
          const mouseKeyboard = cs.filter((c) => c instanceof MouseKeyboard)
          return [...(joyCons as Controller[]), ...mouseKeyboard]
        }),
    })
    if (window.localStorage.getItem(MOUSE_KEYBOARD)) {
      connectMouseKeyboard()
    }
    window.addEventListener(MOUSE_KEYBOARD + '-add', addMouseKeyboard)
    window.addEventListener(MOUSE_KEYBOARD + '-remove', removeMouseKeyboard)

    return () => {
      window.removeEventListener(MOUSE_KEYBOARD + '-add', addMouseKeyboard)
      window.removeEventListener(
        MOUSE_KEYBOARD + '-remove',
        removeMouseKeyboard,
      )
    }
  }, [])

  const removeMouseKeyboard = () =>
    setControllers((cs) => cs.filter((c) => !(c instanceof MouseKeyboard)))

  const addMouseKeyboard = () => {
    const controller = new MouseKeyboard(controllers.length, window)
    setControllers((cs) => {
      if (cs.some((c) => c instanceof MouseKeyboard)) {
        return cs
      }
      return [...cs, controller as Controller].sort(byId)
    })
    controller.open()
  }

  const connectJoyCon = async () => {
    const controller = await requestJoyCon()
    if (!controller) return

    setControllers((cs) => [...cs, controller as Controller].sort(byId))
  }

  const disconnectJoyCon = (controller: Controller) =>
    (controller as JoyCon).close()

  const disconnectMouseKeyboard = () => {
    controllers.find((c) => c instanceof MouseKeyboard)?.close()
    window.localStorage.removeItem(MOUSE_KEYBOARD)
    document.body.classList.remove('mouse-keyboard-controller')
    window.dispatchEvent(new CustomEvent(MOUSE_KEYBOARD + '-remove'))
  }

  const connectMouseKeyboard = () => {
    if (controllers.some((c) => c instanceof MouseKeyboard)) {
      return
    }
    window.localStorage.setItem(MOUSE_KEYBOARD, 'true')
    document.body.classList.add('mouse-keyboard-controller')
    window.dispatchEvent(new CustomEvent(MOUSE_KEYBOARD + '-add'))
  }

  return {
    controllers,
    connectJoyCon,
    disconnectJoyCon,
    connectMouseKeyboard,
    disconnectMouseKeyboard,
  }
}

const byId = (a: Controller, b: Controller) => a.id - b.id
