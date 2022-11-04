import { useEffect, useRef, useState } from 'react'

export const useTimedCounter = (end: number, run: boolean) => {
  const [time, setTime] = useState(0)
  let timeout = useRef(0)

  useEffect(() => {
    if (time >= end || !run) {
      return
    }

    timeout.current = window.setTimeout(() => {
      setTime((s) => s + 1)
    }, 1000)

    return () => {
      window.clearTimeout(timeout.current)
    }
  }, [time, run])

  return time
}
