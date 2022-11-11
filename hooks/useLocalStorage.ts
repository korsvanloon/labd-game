import { useState } from 'react'
import { retrieveData, storeData } from '../util/local-storage'

export default function useLocalStorage<T>(name: string) {
  const [state, setState] = useState(retrieveData<T>(name))

  return [
    state,
    (value: T) => {
      storeData(name, value ?? null)
      setState(value)
    },
  ] as const
}
