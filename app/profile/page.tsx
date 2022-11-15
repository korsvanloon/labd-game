import { Profiles } from '../../components/Profiles'
import playerStyles from '../../styles/Player.module.css'
import profilesStyles from '../../styles/Profiles.module.css'

export default async function Page() {
  return (
    <Profiles
      styles={{
        player: playerStyles,
        profiles: profilesStyles,
      }}
    />
  )
}
