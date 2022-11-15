import { useEffect, useState } from 'react'
import { retrieveData, storeData } from '../util/local-storage'

export default function useLocalStorage<T>(name: string) {
  const [state, setState] = useState<T | undefined>()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setState(retrieveData<T>(name))
    }
  }, [])

  return [
    state,
    (value: T) => {
      storeData(name, value ?? null)
      setState(value)
    },
  ] as const
}
