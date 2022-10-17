import clsx from 'clsx'
import React from 'react'
import { Level, LevelProgress } from '../lib/level'
import styles from './GameLevel.module.css'

type Props = {
  level: Level
  progress: LevelProgress
} & React.HTMLAttributes<HTMLDivElement>

export const GameLevel = ({ level, progress, ...attributes }: Props) => {
  return (
    <div {...attributes} className={clsx(styles.website, attributes.className)}>
      <div className={styles.header}>{level.url}</div>
      <div
        className={clsx('scrollable')}
        key={level.rootComponent.selector}
        dangerouslySetInnerHTML={{ __html: level.rootComponent.html }}
      />
    </div>
  )
}
