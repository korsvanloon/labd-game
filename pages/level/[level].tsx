import { existsSync } from 'fs'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { Apis } from '../../components/Apis'
import { AppBar } from '../../components/AppBar'
import { Browser } from '../../components/Browser'
import { CodeEditor } from '../../components/CodeEditor'
import { PlayerView } from '../../components/Player'
import { Sprint } from '../../components/Sprint'
import { TicketCard } from '../../components/Ticket'
import { Profile } from '../../data/profiles'
import { handleAction } from '../../game/action-handler'
import { cheats } from '../../game/cheats'
import {
  createLevel,
  Level,
  readLevelFile,
  readLevelHtml,
} from '../../game/level'
import {
  getNextComponents,
  initialLevelProgress,
  LevelState,
  Ticket,
} from '../../game/level-progress'
import { useControllers } from '../../hooks/useControllers'
import { shuffle } from '../../util/collection'
import { randomSeed } from '../../util/random'
import styles from './level.module.css'

type Props = {
  level: Level
}

const seed = 2
const random = randomSeed(seed)

export default function LevelView({ level }: Props) {
  const [controllers, addJoyCon, addMouseKeyboard] = useControllers()
  const [levelState, setLevelState] = useState<LevelState>(
    initialLevelProgress(level),
  )
  const [controllerProfiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    // For debugging
    Object.assign(window, cheats(setLevelState, level))

    // set initial progress
    setLevelState((state) => ({
      ...state,
      tickets: [
        ...state.tickets.slice(0, 5),
        ...shuffle(
          [
            ...state.tickets.slice(5),
            ...getNextComponents(
              level.rootComponent,
              state.tickets,
            ).map<Ticket>((component, i) => ({
              component,
              progress: i === 0 ? 'coding' : 'specified',
            })),
          ],
          random,
        ),
      ],
    }))
  }, [])
  return (
    <div className={styles.app}>
      <Head>
        {level.styles.map((style, i) => (
          <link key={i} rel="stylesheet" href={style} />
        ))}
      </Head>

      <AppBar
        level={level}
        levelState={levelState}
        controllerProfiles={controllerProfiles}
        controllers={controllers}
        onAddJoyCon={addJoyCon}
        onAddMouseKeyboard={addMouseKeyboard}
      />

      <div className={styles.container}>
        <Browser level={level} progress={levelState} className={styles.level} />
        <Apis level={level} />

        <div className={styles.bottomPanels}>
          <CodeEditor levelProgress={levelState} />

          <Sprint tickets={levelState.tickets} />
        </div>
      </div>

      <div className={styles.playerContainer}>
        {controllers.map((controller) => (
          <PlayerView
            key={controller.id}
            controller={controller}
            profile={controllerProfiles[controller.id]}
            onChangeProfile={(p) => {
              controllerProfiles[controller.id] = p
              setProfiles([...controllerProfiles])
            }}
            level={level}
            levelProgress={levelState}
            onAction={handleAction(setLevelState, level, controller)}
          >
            {levelState.tickets
              .filter((p) => p.player === controller.id)
              .map((ticket) => (
                <TicketCard
                  key={ticket.component.id}
                  ticket={ticket}
                  rotation={-0.4}
                  className={styles.playerTicket}
                  componentClassName={styles.playerTicketComponent}
                />
              ))}
          </PlayerView>
        ))}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
}) => {
  const levelName = query.level as string

  try {
    const levelFile = readLevelFile(levelName)

    const htmlString = existsSync(`./data/sites/${levelName}.html`)
      ? readLevelHtml(levelName)
      : await fetch(levelFile.url).then((r) => r.text())

    const level = createLevel(htmlString, levelFile)

    return {
      props: {
        level,
      },
    }
  } catch (e) {
    console.error(e)
    return {
      notFound: true,
    }
  }
}
