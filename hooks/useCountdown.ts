import { useEffect, useState } from 'react'

export const useTimedCounter = (end: number, run: boolean) => {
  const [time, setTime] = useState(0)
  useEffect(() => {
    if (time < end && run) {
      window.setTimeout(() => {
        setTime((s) => s + 1)
      }, 1000)
    }
  }, [time, run])

  return time
}
