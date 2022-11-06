import { useEffect } from 'react'
import { PlayerEvent } from '../components/Player'

export const usePlayerEvent = (
  element: HTMLElement | null,
  callback: (details: PlayerEvent, event: Event) => void,
) =>
  useEffect(() => {
    const handler = (event: Event) => {
      const details = (event as CustomEvent).detail as PlayerEvent

      callback(details, event)
    }
    element?.addEventListener('player-button', handler, true)
    return () => {
      element?.removeEventListener('player-button', handler, true)
    }
  }, [element])
