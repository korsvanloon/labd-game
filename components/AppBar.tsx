import clsx from 'clsx'
import { CSSProperties, HTMLAttributes, useEffect, useState } from 'react'
import {
  ScoreNumber,
  Styles as ScoreNumberStyles,
} from '../components/ScoreNumber'
import { Level } from '../game/level'
import { calculateScore, LevelState } from '../game/level-progress'
import { usePrevious } from '../hooks/usePrevious'
import { useProfiles } from '../hooks/useProfiles'
import { formatTime } from '../util/format'

export type Styles = {
  appBar: {
    userScore: string | undefined
    stats?: string
    connect?: string
    root?: string
  }
} & ScoreNumberStyles

type Props = {
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
  ...attributes
}: Props) => {
  const [profiles] = useProfiles()

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
          <span>Score</span>
          <div>
            {profiles.map((profile, i) => (
              <div key={i} className={styles.appBar.userScore}>
                <span>{profile?.name}</span>
                <ChangeScore
                  level={level}
                  levelState={levelState}
                  player={i}
                  time={time}
                  styles={styles}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <span>Features</span>

          <strong>{`${totalDeployed - 1} / ${
            level.totalComponents - 1
          }`}</strong>
        </div>
        <div>
          <span>Time left</span>

          <strong>{formatTime(level.totalTime - time)}</strong>
        </div>
      </div>
    </header>
  )
}

const ChangeScore = ({
  player,
  level,
  levelState,
  time,
  styles,
}: {
  player: number
  levelState: LevelState
  level: Level
  time: number
  styles: Styles
}) => {
  const score = calculateScore(player, level, levelState, time)

  useEffect(() => {
    setScoreChanged(true)
    window.setTimeout(() => {
      setScoreChanged(false)
    }, 1000)
  }, [score])

  const previousScore = usePrevious(score)
  const [scoreChange, setScoreChanged] = useState(false)

  return (
    <ScoreNumber
      changed={scoreChange}
      style={
        {
          '--color':
            score >= (previousScore ?? score) ? 'var(--yellow)' : 'var(--red)',
        } as CSSProperties
      }
      styles={styles}
    >
      {score}
    </ScoreNumber>
  )
}
