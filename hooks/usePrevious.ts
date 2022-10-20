import { useRef } from 'react'

export const usePrevious = <T>(value: T) => {
  const ref = useRef({
    value: value,
    prev: null as null | T,
  })

  const current = ref.current.value

  if (value !== current) {
    ref.current = {
      value: value,
      prev: current,
    }
  }

  return ref.current.prev
}
