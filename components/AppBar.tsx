import clsx from 'clsx'
import { CSSProperties, HTMLAttributes, useEffect, useState } from 'react'
import {
  ScoreNumber,
  Styles as ScoreNumberStyles,
} from '../components/ScoreNumber'
import { Controller } from '../controller/interface'
import { JoyCon } from '../controller/joy-con/joycon'
import { MouseKeyboard } from '../controller/mouse-keyboard'
import { Profile, profiles } from '../data/profiles'
import { Level } from '../game/level'
import { calculateScore, LevelState } from '../game/level-progress'
import { usePrevious } from '../hooks/usePrevious'
import IconJoyCon from '../public/icon-joycon.svg'
import IconKeyboard from '../public/icon-keyboard.svg'
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
  controllerProfiles: Profile[]
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
  controllerProfiles,
  controllers,
  onAddJoyCon,
  onAddMouseKeyboard,
  ...attributes
}: Props) => {
  const score = calculateScore(levelState)

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
      <button
        className={clsx(styles.appBar.connect)}
        type="button"
        onClick={onAddJoyCon}
        disabled={controllers.filter((c) => c instanceof JoyCon).length === 2}
      >
        <span>Connect Joy-Con</span>
        <IconJoyCon />
      </button>
      <button
        className={clsx(styles.appBar.connect)}
        type="button"
        disabled={controllers.some((c) => c instanceof MouseKeyboard)}
        onClick={onAddMouseKeyboard}
      >
        <span>Connect Mouse-Keyboard</span>
        <IconKeyboard />
      </button>
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
