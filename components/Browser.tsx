import clsx from 'clsx'
import React from 'react'
import { Level } from '../game/level'
import { LevelState } from '../game/level-progress'
import styles from './Browser.module.css'

type Props = {
  level: Level
  progress: LevelState
} & React.HTMLAttributes<HTMLDivElement>

export const Browser = ({ level, progress, ...attributes }: Props) => {
  return (
    <div
      {...attributes}
      className={clsx(styles.Browser, attributes.className)}
      data-action-zone="browser"
    >
      <div className={styles.header}>{level.url}</div>
      <div
        className={clsx('scrollable')}
        key={level.rootComponent.selector}
        dangerouslySetInnerHTML={{ __html: level.rootComponent.html }}
      />
    </div>
  )
}
