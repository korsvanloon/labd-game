'use client'
import clsx from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { handleAction } from '../game/action-handler'
import { cheats } from '../game/cheats'
import { Level } from '../game/level'
import { initialLevelProgress, LevelState } from '../game/level-progress'
import { useControllers } from '../hooks/useControllers'
import useTimedCounter from '../hooks/useCountdown'
import usePlayerEvent from '../hooks/usePlayerEvent'
import { useProfiles } from '../hooks/useProfiles'
import IconApi from '../public/icons/icon-api.svg'
import IconCodeEditor from '../public/icons/icon-code-editor.svg'
import IconEspressoMachine from '../public/icons/icon-espresso-machine.svg'
import { randomSeed } from '../util/random'
import { Apis, Styles as ApisStyles } from './Apis'
import { AppBar, Styles as AppBarStyles } from './AppBar'
import { Browser, Styles as BrowserStyles } from './Browser'
import { CodeEditor, Styles as CodeEditorStyles } from './CodeEditor'
import { Styles as DialogSelectStyles } from './DialogSelect'
import { PlayerEvent, PlayerStyles, PlayerView } from './Player'
import { ScoreNumber, Styles as ScoreNumberStyles } from './ScoreNumber'
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
    computer?: string
    workspaces?: string
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
  const { context, controllers, setControllerContext } = useControllers()
  const [levelState, setLevelState] = useState<LevelState>(
    initialLevelProgress(level),
  )
  const [profiles] = useProfiles()

  const time = useTimedCounter(
    level.totalComponents * 60,
    !levelState.finished && context[0] === 'Main',
  )

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

    if (typeof window !== 'undefined') {
      const siteSlug = level.url
        .replace(/https:\/\/(www\.)?/, '')
        .replace(/[\.\/]/g, '-')

      addStyleSheet(`/styles/${level.slug}.css`)
    }
  }, [])

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.style.setProperty(
      '--browser-scale',
      ((window.innerWidth * 0.3) / 1200).toFixed(1),
    )
  }, [ref.current])

  const handlePlayerEvent = useCallback(
    (details: PlayerEvent, event: Event) => {
      if (details.event.soloValue === 'special') {
        setControllerContext('MainMenu')
      } else {
        handleAction(
          setLevelState,
          level,
          controllers[details.controllerId],
        )(details.event, details.actionZones)
      }
      event.stopPropagation()
    },
    [controllers],
  )

  usePlayerEvent(ref.current, handlePlayerEvent)

  return (
    <div className={styles.level.root} ref={ref}>
      <AppBar
        level={level}
        levelState={levelState}
        time={time}
        styles={styles}
      />

      <Browser
        level={level}
        progress={levelState}
        className={styles.level.level}
        styles={styles}
      />
      <div className={styles.level.container}>
        <div>
          <Sprint tickets={levelState.tickets} styles={styles} />

          <IconEspressoMachine width={40} height={40} />
        </div>
        <div className={styles.level.workspaces}>
          {levelState.activeWorkspaces.map((active, id) => (
            <div key={id}>
              <div className={styles.level.computer}>
                {/* <IconComputer /> */}
                <IconCodeEditor
                  data-action-zone="set-workspace"
                  data-work="code-editor"
                  data-id={id}
                  className={clsx(active === 'code-editor' && 'active')}
                />
                <IconApi
                  data-action-zone="set-workspace"
                  data-work="api"
                  data-id={id}
                  className={clsx(active === 'api' && 'active')}
                />
              </div>
              {active === 'code-editor' ? (
                <CodeEditor
                  workspaceId={id}
                  ticket={levelState.tickets.find(
                    (t) => t.workspace === id && t.progress === 'coding',
                  )}
                  styles={styles}
                />
              ) : (
                <Apis level={level} styles={styles} />
              )}
            </div>
          ))}
        </div>
      </div>

      {context[0] === 'Main' && (
        <div className={styles.level.playerContainer}>
          {controllers.map((controller) => (
            <PlayerView
              key={controller.id}
              controller={controller}
              profile={profiles[controller.id]}
              styles={styles}
            >
              {levelState.tickets
                .filter(
                  (t) => t.player === controller.id && t.progress !== 'coding',
                )
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
        </div>
      )}

      {levelState.finished === 'won' && (
        <ScoreNumber
          changed
          className={styles.appBar.winMessage}
          styles={styles}
        >
          Completed
        </ScoreNumber>
      )}
      {levelState.finished === 'lost' && (
        <ScoreNumber
          changed
          className={styles.appBar.loseMessage}
          styles={styles}
        >
          Deadline failed!
        </ScoreNumber>
      )}
    </div>
  )
}

const addStyleSheet = (href: string) => {
  const style = document.createElement('link')
  style.rel = 'stylesheet'
  style.href = href
  document.head.appendChild(style)
}
