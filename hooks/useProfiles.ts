import { createGlobalState } from 'react-hooks-global-state'
import { Profile, profiles } from '../data/profiles'

const PROFILES = 'profiles'

export const useProfiles = () => {
  const [state, setState] = useGlobalState(PROFILES)

  const setProfile = (id: number, name: string) => {
    const data = getData<string[]>(PROFILES) ?? []
    data[id] = name
    setData(
      PROFILES,
      data.map((d) => d ?? null),
    )
    setState(data.map((name) => profiles.find((p) => p.name === name)))
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

const { useGlobalState } = createGlobalState<{
  profiles: (Profile | undefined)[]
}>({
  profiles:
    (typeof window !== 'undefined'
      ? getData<(string | null)[]>(PROFILES)?.map((name) =>
          profiles.find((p) => p.name === name),
        )
      : []) ?? [],
})
