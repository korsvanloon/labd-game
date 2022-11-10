import { useEffect } from 'react'
import { createGlobalState } from 'react-hooks-global-state'
import { ButtonEvent, Controller, MoveEvent } from '../controller/interface'
import { JoyConConnection, requestJoyCon } from '../controller/joy-con'
import { MouseKeyboard } from '../controller/mouse-keyboard'
import { ControllerContext } from '../game/controller-context'

const CONTROLLER = 'controller'

let mouseController: MouseKeyboard | undefined
let context: ControllerContext[] = []

const { useGlobalState } = createGlobalState<{
  controllers: Controller<ControllerContext>[]
  context?: ControllerContext
  mouseController?: MouseKeyboard
}>({ controllers: [] })

export const useControllers = () => {
  const [controllers, setControllers] = useGlobalState('controllers')

  useEffect(() => {
    JoyConConnection()

    window.addEventListener(CONTROLLER + '-add', addController)
    window.addEventListener(CONTROLLER + '-remove', removeController)
    window.addEventListener(CONTROLLER + '-context', updateControllerContext)

    if (window.localStorage.getItem(CONTROLLER)) {
      const controller = new MouseKeyboard(controllers.length, window)
      connectController(controller)
    }

    return () => {
      window.removeEventListener(CONTROLLER + '-add', addController)
      window.removeEventListener(CONTROLLER + '-remove', removeController)
      window.removeEventListener(
        CONTROLLER + '-context',
        updateControllerContext,
      )
    }
  }, [controllers])

  const removeController = (event: Event) => {
    const controller = (event as CustomEvent).detail as Controller
    controller.close()
    return setControllers((cs) => cs.filter((c) => c !== controller))
  }

  const addController = (event: Event) => {
    const controller = (event as CustomEvent).detail as Controller

    setControllers((cs) => {
      if (
        controller instanceof MouseEvent &&
        cs.some((c) => c instanceof MouseKeyboard)
      ) {
        return cs
      }
      controller.context = context[Math.min(context.length - 1, controller.id)]
      controller.open()
      return [
        ...cs.filter((c) => c.id !== controller.id),
        controller as Controller,
      ].sort(byId)
    })
  }

  const connectJoyCon = async () => {
    const controller = await requestJoyCon()
    if (!controller) return
  }

  const updateControllerContext = (event: Event) => {
    context = (event as CustomEvent).detail as ControllerContext[]
    setControllers((cs) => {
      cs.forEach((c, i) => {
        return (c.context = context[Math.min(i, context.length - 1)])
      })
      return [...cs]
    })
  }

  const disconnectController = (controller: Controller) => {
    if (controller instanceof MouseKeyboard) {
      window.localStorage.removeItem(CONTROLLER)
      document.body.classList.remove('mouse-keyboard-controller')
    }
    window.dispatchEvent(
      new CustomEvent(CONTROLLER + '-remove', { detail: controller }),
    )
  }

  const connectController = (controller: Controller) => {
    if (controller instanceof MouseKeyboard) {
      if (controllers.some((c) => c instanceof MouseKeyboard)) {
        return
      }
      window.localStorage.setItem(CONTROLLER, 'true')
      document.body.classList.add('mouse-keyboard-controller')
    }
    window.dispatchEvent(
      new CustomEvent(CONTROLLER + '-add', { detail: controller }),
    )
  }

  const setControllerContext = (...context: ControllerContext[]) => {
    window.dispatchEvent(
      new CustomEvent(CONTROLLER + '-context', { detail: context }),
    )
  }

  return {
    context,
    controllers,
    connectJoyCon,
    disconnectController,
    connectController,
    setControllerContext,
  }
}

const byId = (a: Controller, b: Controller) => a.id - b.id

export const useControllerMoveEvent = (
  context: ControllerContext,
  onMove: (details: MoveEvent) => void,
  deps: any[] = [],
) => {
  const { controllers } = useControllers()

  useEffect(() => {
    controllers.forEach((c) => {
      c.addMoveListener(context, onMove)
    })

    return () => {
      controllers.forEach((c) => {
        c.removeMoveListener(onMove)
      })
    }
  }, [controllers, context, ...deps])
}
export const useControllerButtonEvent = (
  context: ControllerContext,
  onButton: (details: ButtonEvent) => void,
  deps: any[] = [],
) => {
  const { controllers } = useControllers()

  useEffect(() => {
    controllers.forEach((c) => {
      c.addButtonListener(context, onButton)
    })
    return () => {
      controllers.forEach((c) => {
        c.removeButtonListener(onButton)
      })
    }
  }, [controllers, context, ...deps])
}
