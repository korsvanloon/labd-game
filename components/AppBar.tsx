import clsx from 'clsx'
import { CSSProperties, HTMLAttributes, useEffect, useState } from 'react'
import {
  ScoreNumber,
  Styles as ScoreNumberStyles,
} from '../components/ScoreNumber'
import { Controller } from '../controller/interface'
import { Level } from '../game/level'
import { calculateScore, LevelState } from '../game/level-progress'
import { usePrevious } from '../hooks/usePrevious'
import { formatTime } from '../util/format'

export type Styles = {
  appBar: {
    loseMessage?: string
    winMessage?: string
    stats?: string
    connect?: string
    root?: string
  }
} & ScoreNumberStyles

type Props = {
  controllers: Controller[]
  onAddJoyCon: () => Promise<void> | void
  onAddMouseKeyboard: () => Promise<void> | void
  // controllerProfiles: Profile[]
  levelState: LevelState
  level: Level
  time: number
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export const AppBar = ({
  level,
  styles,
  levelState,
  time,
  // controllerProfiles,
  controllers,
  onAddJoyCon,
  onAddMouseKeyboard,
  ...attributes
}: Props) => {
  const score = calculateScore(level, levelState, time)

  useEffect(() => {
    setScoreChanged(true)
    window.setTimeout(() => {
      setScoreChanged(false)
    }, 1000)
  }, [score])

  const previousScore = usePrevious(score)
  const [scoreChange, setScoreChanged] = useState(false)

  const totalDeployed = levelState.tickets.filter(
    (c) => c.progress === 'deployed',
  ).length

  return (
    <header
      {...attributes}
      className={clsx(styles.appBar.root, attributes.className)}
    >
      <div className={styles.appBar.stats}>
        <div>
          <span>Time left</span>

          <strong>{formatTime(level.totalTime - time)}</strong>
        </div>
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
            styles={styles}
          >
            {score}
          </ScoreNumber>
        </div>
      </div>

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
    </header>
  )
}
