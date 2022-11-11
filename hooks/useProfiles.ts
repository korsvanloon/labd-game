import { createGlobalState } from 'react-hooks-global-state'
import { Profile, profiles } from '../data/profiles'
import { retrieveData, storeData } from '../util/local-storage'

const PROFILES = 'profiles'

export const useProfiles = () => {
  const [state, setState] = useGlobalState(PROFILES)

  const setProfile = (id: number, name: string) => {
    const data = retrieveData<string[]>(PROFILES) ?? []
    data[id] = name
    storeData(
      PROFILES,
      data.map((d) => d ?? null),
    )
    setState(data.map((name) => profiles.find((p) => p.name === name)))
  }

  return [state, setProfile] as const
}

const { useGlobalState } = createGlobalState<{
  profiles: (Profile | undefined)[]
}>({
  profiles:
    (typeof window !== 'undefined'
      ? retrieveData<(string | null)[]>(PROFILES)?.map((name) =>
          profiles.find((p) => p.name === name),
        )
      : []) ?? [],
})
