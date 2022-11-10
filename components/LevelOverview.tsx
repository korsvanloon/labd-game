'use client'
import { capitalCase } from 'change-case'
import clsx from 'clsx'
import Link from 'next/link'
import { HTMLAttributes, useRef, useState } from 'react'
import {
  useControllerButtonEvent,
  useControllerMoveEvent,
  useControllers,
} from '../hooks/useControllers'

export type LevelOverviewStyles = {
  levelOverview: {
    root?: string
    link?: string
    linkList?: string
    selected?: string
  }
}

type Props = {
  levels: string[]
  styles: LevelOverviewStyles
} & HTMLAttributes<HTMLDivElement>

export const LevelOverview = ({ levels, styles, ...attributes }: Props) => {
  const [selected, setSelected] = useState(0)
  const { setControllerContext } = useControllers()
  const ref = useRef<HTMLDivElement>(null)

  useControllerButtonEvent(
    'Main',
    (details) => {
      if (details.sameButtonCount > 0) return

      const currentSelected = ref.current?.querySelectorAll('a').item(selected)

      switch (details.soloValue) {
        case 'left':
          setControllerContext('MainMenu')

          break
        case 'right':
        case 'down':
          currentSelected?.click()
          break
      }
    },
    [ref.current, selected],
  )

  useControllerMoveEvent(
    'Main',
    (details) => {
      if (details.sameDirectionCount > 0) return

      const n = levels.length

      switch (details.direction) {
        case 'down':
          setSelected((s) => (s + 1) % n)
          break
        case 'up':
          setSelected((s) => (s + n - 1) % n)
          break
      }
    },
    [],
  )

  return (
    <div {...attributes} ref={ref} className={styles.levelOverview.root}>
      <ol className={styles.levelOverview.linkList}>
        {levels.map((level, i) => (
          <li key={level}>
            <Link
              href={`/level/${level}`}
              prefetch={false}
              className={clsx(
                styles.levelOverview.link,
                selected === i && styles.levelOverview.selected,
              )}
            >
              {capitalCase(level.replace(/^\d{2}-/, ''))}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
