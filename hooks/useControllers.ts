import { useState, useEffect } from 'react'
import { JoyConConnection, requestJoyCon } from '../joy-con'
import { JoyCon } from '../joy-con/joycon'

export const useControllers = () => {
  const [controllers, setControllers] = useState<JoyCon[]>([])

  useEffect(() => {
    JoyConConnection({
      onChangeControllers: setControllers,
    })
  }, [])

  const requestNewJoyCon = async () => {
    const controller = await requestJoyCon()
    if (!controller) return
    const newControllers = [...controllers, controller].sort(
      (a, b) => a.id - b.id,
    )
    setControllers(newControllers)
  }

  return [controllers, requestNewJoyCon] as const
}
