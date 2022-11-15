import { useEffect } from 'react'

type GameEvent = ApiEvent
type ApiEvent = {
  duration: number | undefined
  type: 'api'
  workspace: number
  componentId: string
}

const LEVEL_EVENT = 'level'

export default function useGameEvent(
  callback: (details: GameEvent, event: Event) => void,
) {
  useEffect(() => {
    const handler = (event: Event) => {
      const details = (event as CustomEvent).detail as GameEvent

      callback(details, event)
    }
    document?.addEventListener(LEVEL_EVENT, handler, true)
    return () => {
      document?.removeEventListener(LEVEL_EVENT, handler, true)
    }
  }, [callback])
}

export function fireGameEvent(event: GameEvent) {
  document.dispatchEvent(new CustomEvent(LEVEL_EVENT, { detail: event }))
}
