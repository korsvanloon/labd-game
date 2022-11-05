'use client'
import { useEffect, useState } from 'react'
import { Profile } from '../data/profiles'
import { handleAction } from '../game/action-handler'
import { cheats } from '../game/cheats'
import { Level } from '../game/level'
import {
  getNextComponents,
  initialLevelProgress,
  LevelState,
  Ticket,
} from '../game/level-progress'
import { useControllers } from '../hooks/useControllers'
import { useTimedCounter } from '../hooks/useCountdown'
import { shuffle } from '../util/collection'
import { randomSeed } from '../util/random'
import { Apis, Styles as ApisStyles } from './Apis'
import { AppBar, Styles as AppBarStyles } from './AppBar'
import { Browser, Styles as BrowserStyles } from './Browser'
import { CodeEditor, Styles as CodeEditorStyles } from './CodeEditor'
import { Styles as DialogSelectStyles } from './DialogSelect'
import { PlayerStyles, PlayerView } from './Player'
import { Styles as ScoreNumberStyles } from './ScoreNumber'
import { Sprint, Styles as SprintStyles } from './Sprint'
import { Styles as TicketStyles, TicketCard } from './Ticket'

export type Styles = {
  level: {
    root?: string
    container?: string
    level?: string
    playerContainer?: string
    playerTicket?: string
    playerTicketComponent?: string
    bottomPanels?: string
  }
} & AppBarStyles &
  ApisStyles &
  BrowserStyles &
  CodeEditorStyles &
  DialogSelectStyles &
  PlayerStyles &
  ScoreNumberStyles &
  TicketStyles &
  SprintStyles

type Props = {
  level: Level
  styles: Styles
}

const seed = 2
const random = randomSeed(seed)

export default function LevelView({ level, styles }: Props) {
  const { controllers, connectJoyCon, connectMouseKeyboard } = useControllers()
  const [levelState, setLevelState] = useState<LevelState>(
    initialLevelProgress(level),
  )

  const time = useTimedCounter(level.totalComponents * 60, !levelState.finished)

  useEffect(() => {
    const totalDeployed = levelState.tickets.filter(
      (c) => c.progress === 'deployed',
    ).length

    const lost = level.totalTime === time
    const won = totalDeployed === level.totalComponents

    if (won) {
      setLevelState((s) => ({ ...s, finished: 'won' }))
    }
    if (lost) {
      setLevelState((s) => ({ ...s, finished: 'lost' }))
    }
  }, [time])

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
    <div className={styles.level.root}>
      <AppBar
        level={level}
        levelState={levelState}
        controllers={controllers}
        onAddJoyCon={connectJoyCon}
        onAddMouseKeyboard={connectMouseKeyboard}
        time={time}
        styles={styles}
      />

      <div className={styles.level.container}>
        <Browser
          level={level}
          progress={levelState}
          className={styles.level.level}
          styles={styles}
        />
        <Apis level={level} styles={styles} />

        <div className={styles.level.bottomPanels}>
          <CodeEditor levelProgress={levelState} styles={styles} />

          <Sprint tickets={levelState.tickets} styles={styles} />
        </div>
      </div>

      {/* <div className={styles.level.playerContainer}>
        {controllers.map((controller) => (
          <PlayerView
            key={controller.id}
            controller={controller}
            profile={controllerProfiles[controller.id]}
            // onChangeProfile={(p) => {
            //   controllerProfiles[controller.id] = p
            //   setProfiles([...controllerProfiles])
            // }}
            onAction={handleAction(setLevelState, level, controller)}
            styles={styles}
          >
            {levelState.tickets
              .filter((p) => p.player === controller.id)
              .map((ticket) => (
                <TicketCard
                  key={ticket.component.id}
                  ticket={ticket}
                  rotation={-0.4}
                  className={styles.level.playerTicket}
                  componentClassName={styles.level.playerTicketComponent}
                  styles={styles}
                />
              ))}
          </PlayerView>
        ))}
      </div> */}
    </div>
  )
}
