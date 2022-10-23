import clsx from 'clsx'
import { CSSProperties, HTMLAttributes, useEffect, useState } from 'react'
import { ScoreNumber } from '../components/ScoreNumber'
import { Controller } from '../controller/interface'
import { JoyCon } from '../controller/joy-con/joycon'
import { MouseKeyboard } from '../controller/mouse-keyboard'
import { Profile, profiles } from '../data/profiles'
import { Level } from '../game/level'
import { calculateScore, LevelState } from '../game/level-progress'
import { usePrevious } from '../hooks/usePrevious'
import IconJoyCon from '../public/icon-joycon.svg'
import IconKeyboard from '../public/icon-keyboard.svg'
import styles from './AppBar.module.css'

type Props = {
  controllers: Controller[]
  onAddJoyCon: () => Promise<void> | void
  onAddMouseKeyboard: () => Promise<void> | void
  controllerProfiles: Profile[]
  levelState: LevelState
  level: Level
} & HTMLAttributes<HTMLDivElement>

export const AppBar = ({
  level,
  levelState,
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
    <header {...attributes} className={clsx(styles.AppBar)}>
      <button
        className={clsx(styles.connect)}
        type="button"
        onClick={onAddJoyCon}
        disabled={controllers.filter((c) => c instanceof JoyCon).length === 2}
      >
        <span>Connect Joy-Con</span>
        <IconJoyCon />
      </button>
      <button
        className={clsx(styles.connect)}
        type="button"
        disabled={controllers.some((c) => c instanceof MouseKeyboard)}
        onClick={onAddMouseKeyboard}
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
  )
}
