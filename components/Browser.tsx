import clsx from 'clsx'
import React from 'react'
import { Level } from '../game/level'
import { LevelState } from '../game/level-progress'

export type Styles = {
  browser: {
    root?: string
    header?: string
  }
}

type Props = {
  level: Level
  progress: LevelState
  styles: Styles
} & React.HTMLAttributes<HTMLDivElement>

export const Browser = ({ level, progress, styles, ...attributes }: Props) => {
  return (
    <div
      {...attributes}
      className={clsx(styles.browser.root, attributes.className, 'browser')}
    >
      <div className={styles.browser.header}>{level.url}</div>
      <div
        data-action-zone="vertical-scroll"
        key={level.rootComponent.selector}
        dangerouslySetInnerHTML={{ __html: level.rootComponent.html }}
      />
    </div>
  )
}
