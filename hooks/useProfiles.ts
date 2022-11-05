import { useEffect, useState } from 'react'
import { Profile, profiles } from '../data/profiles'

const PROFILES = 'profiles'

export const useProfiles = () => {
  const [state, setState] = useState<(Profile | undefined)[]>(
    getData<(string | null)[]>(PROFILES)?.map((name) =>
      profiles.find((p) => p.name === name),
    ) ?? [],
  )

  useWindowEvent(PROFILES, () => {
    setState(
      getData<(string | null)[]>(PROFILES)?.map((name) =>
        profiles.find((p) => p.name === name),
      ) ?? [],
    )
  })

  const setProfile = (id: number, name: string) => {
    const data = getData<string[]>(PROFILES) ?? []
    data[id] = name
    // setState(data.map((name) => profiles.find((p) => p.name === name)))
    setData(
      PROFILES,
      data.map((d) => d ?? null),
    )
    window.dispatchEvent(new CustomEvent(PROFILES))
  }

  return [state, setProfile] as const
}

const getData = <T>(name: string) => {
  const data = window.localStorage.getItem(name)
  if (data) {
    return JSON.parse(data) as T
  }
}
const setData = (name: string, item: any) => {
  window.localStorage.setItem(name, JSON.stringify(item))
}
export const useWindowEvent = (
  eventName: string,
  handler: (event: Event) => void,
) =>
  useEffect(() => {
    window.addEventListener(eventName, handler)

    return () => {
      window.removeEventListener(eventName, handler)
    }
  }, [])
