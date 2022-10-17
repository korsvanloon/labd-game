import clsx from 'clsx'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import { Editor } from '../components/Editor'
import { GameLevel } from '../components/GameLevel'
import { PlayerGame } from '../components/Player'
import { Profile, profiles } from '../data/profiles'
import { useControllers } from '../hooks/useControllers'
import { Level, LevelProgress, readLevelFile } from '../lib/level'
import styles from './game.module.css'

type Props = {
  level: Level
}

export default function Web({ level }: Props) {
  const [controllers, requestNewJoyCon] = useControllers()
  const [levelProgress, setLevelProgress] = useState<LevelProgress>({
    componentsDone: { [level.allComponents[0].id]: level.allComponents[0].id },
  })
  const [controllerProfiles, setProfiles] = useState<Profile[]>([])

  const baseFreq = 40.875885
  return (
    <div className={styles.app}>
      <Head>
        {level.styles.map((style, i) => (
          <link key={i} rel="stylesheet" href={style} />
        ))}
      </Head>
      <header>
        <button
          className={clsx(styles.connect)}
          type="button"
          onClick={requestNewJoyCon}
        >
          Connect Joy-Con
        </button>
        <div>
          {controllers.map((controller) => (
            <div key={controller.id}>
              {`[${controller.id}] ${
                controllerProfiles[controller.id]?.name ??
                profiles[controller.id]?.name
              } on ${controller.device.productName}`}
            </div>
          ))}
        </div>
      </header>
      <GameLevel
        level={level}
        progress={levelProgress}
        className={styles.level}
      />
      <Editor ticket={level.allComponents[1]} />
      <div className={styles.playerContainer}>
        {controllers.map((controller) => (
          <PlayerGame
            key={controller.id}
            profile={controllerProfiles[controller.id]}
            onChangeProfile={(p) => {
              controllerProfiles[controller.id] = p
              setProfiles([...controllerProfiles])
            }}
            controller={controller}
            onDropComponent={(component, dropZoneComponentId) =>
              setLevelProgress((p) => ({
                ...p,
                componentsDone: {
                  ...p.componentsDone,
                  [dropZoneComponentId]: component.id,
                },
              }))
            }
            levelProgress={levelProgress}
            level={level}
          />
        ))}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({}) => {
  const level = await readLevelFile('agradi-homepage')

  return {
    props: {
      level,
    },
  }
}
