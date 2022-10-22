import clsx from 'clsx'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { CSSProperties, useEffect, useState } from 'react'
import { Apis } from '../components/Apis'
import { Browser } from '../components/Browser'
import { CodeEditor } from '../components/CodeEditor'
import { PlayerView } from '../components/Player'
import { ScoreNumber } from '../components/ScoreNumber'
import { Sprint } from '../components/Sprint'
import { TicketCard } from '../components/Ticket'
import { JoyCon } from '../controller/joy-con/joycon'
import { MouseKeyboard } from '../controller/mouse-keyboard'
import { Profile, profiles } from '../data/profiles'
import { handleAction } from '../game/action-handler'
import { cheats } from '../game/cheats'
import { createLevel, Level, readLevelFile } from '../game/level'
import {
  calculateScore,
  getNextComponents,
  initialLevelProgress,
  LevelState,
  Ticket,
} from '../game/level-progress'
import { useControllers } from '../hooks/useControllers'
import { usePrevious } from '../hooks/usePrevious'
import IconJoyCon from '../public/icon-joycon.svg'
import IconKeyboard from '../public/icon-keyboard.svg'
import { shuffle } from '../util/collection'
import { randomSeed } from '../util/random'
import styles from './game.module.css'

type Props = {
  level: Level
}

const seed = 2
const random = randomSeed(seed)

export default function LevelView({ level }: Props) {
  const [controllers, requestNewJoyCon, addMouseKeyboard] = useControllers()
  const [levelState, setLevelState] = useState<LevelState>(
    initialLevelProgress(level),
  )
  const [controllerProfiles, setProfiles] = useState<Profile[]>([])

  const score = calculateScore(levelState)
  const previousScore = usePrevious(score)
  const [scoreChange, setScoreChanged] = useState(false)

  useEffect(() => {
    setScoreChanged(true)
    window.setTimeout(() => {
      setScoreChanged(false)
    }, 1000)
  }, [score])

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

  const totalDeployed = levelState.tickets.filter(
    (c) => c.progress === 'deployed',
  ).length

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
          disabled={controllers.filter((c) => c instanceof JoyCon).length === 2}
        >
          <span>Connect Joy-Con</span>
          <IconJoyCon />
        </button>
        <button
          className={clsx(styles.connect)}
          type="button"
          disabled={controllers.some((c) => c instanceof MouseKeyboard)}
          onClick={addMouseKeyboard}
        >
          <span>Connect Mouse-Keyboard</span>
          <IconKeyboard />
        </button>
        <div className={styles.stats}>
          <div>
            <span>Features</span>

            <strong>{`${totalDeployed} / ${level.totalComponents}`}</strong>
          </div>
          <div>
            <span>Score</span>
            <ScoreNumber
              changed={scoreChange}
              style={
                {
                  '--color':
                    score >= (previousScore ?? score)
                      ? 'var(--yellow)'
                      : 'var(--red)',
                } as CSSProperties
              }
            >
              {score}
            </ScoreNumber>
          </div>
        </div>
        <div>
          {controllers.map((controller) => (
            <div key={controller.id}>
              <span>{controller.id + 1} </span>
              <strong>
                {controllerProfiles[controller.id]?.name ??
                  profiles[controller.id]?.name}
              </strong>
              {` on ${controller.deviceName}`}
            </div>
          ))}
        </div>
        <ScoreNumber
          changed={totalDeployed === level.totalComponents}
          className={styles.winMessage}
        >
          {totalDeployed === level.totalComponents ? 'Completed!' : ''}
        </ScoreNumber>
      </header>

      <Apis level={level} />

      <Browser level={level} progress={levelState} className={styles.level} />

      <CodeEditor levelProgress={levelState} />

      <Sprint tickets={levelState.tickets} />

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

export const getServerSideProps: GetServerSideProps<Props> = async ({}) => {
  const levelFile = readLevelFile('agradi-homepage')

  const htmlString = await fetch(levelFile.url).then((r) => r.text())
  const level = createLevel(htmlString, levelFile)

  return {
    props: {
      level,
    },
  }
}
