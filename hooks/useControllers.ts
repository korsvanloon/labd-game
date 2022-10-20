import { useEffect, useState } from 'react'
import { Controller } from '../controller/interface'
import { MouseKeyboard } from '../controller/mouse-keyboard'
import { JoyConConnection, requestJoyCon } from '../joy-con'

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
  }, [])

  const requestNewJoyCon = async () => {
    const controller = await requestJoyCon()
    if (!controller) return

    const newControllers = [...controllers, controller].sort(
      (a, b) => a.id - b.id,
    ) as Controller[]

    setControllers(newControllers)
  }

  const addMouseKeyboard = () => {
    if (controllers.some((c) => c instanceof MouseKeyboard)) {
      return
    }
    const mouseKeyboard = new MouseKeyboard(controllers.length, window)
    mouseKeyboard.open()

    setControllers([...controllers, mouseKeyboard as Controller])
  }

  return [controllers, requestNewJoyCon, addMouseKeyboard] as const
}
