import { Profiles } from '../../components/Profiles'
import playerStyles from '../../styles/Player.module.css'
import profilesStyles from '../../styles/Profiles.module.css'
import styles from './player.module.css'

export default async function Page() {
  return (
    <div className={styles.root}>
      <Profiles
        styles={{
          player: playerStyles,
          profiles: profilesStyles,
        }}
      />
    </div>
  )
}
