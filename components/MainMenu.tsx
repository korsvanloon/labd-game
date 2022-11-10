'use client'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HTMLAttributes, useEffect, useRef, useState } from 'react'
import {
  useControllerButtonEvent,
  useControllerMoveEvent,
  useControllers,
} from '../hooks/useControllers'
import { useProfiles } from '../hooks/useProfiles'
import {
  ControllerButtons,
  Styles as ControllerButtonsStyles,
} from './ControllerButtons'

export type Styles = {
  mainMenu: {
    root?: string
    open?: string
    toggle?: string
    divider?: string
    players?: string
    disabled?: string
    selected?: string
  }
} & ControllerButtonsStyles

type Props = {
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export const useGameProgress = () => {
  return {
    currentLevel: '02-kato-homepage',
  }
}

export const MainMenu = ({ styles, ...attributes }: Props) => {
  const [open, setOpen] = useState(true)
  const [profiles] = useProfiles()
  const { controllers, setControllerContext } = useControllers()
  const gameProgress = useGameProgress()
  const [selected, setSelected] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    setControllerContext('MainMenu')
  }, [open])

  useControllerButtonEvent(
    'MainMenu',
    (details) => {
      if (details.sameButtonCount > 0) return

      const currentSelected = ref.current?.querySelectorAll('a').item(selected)
      const selectedPath = currentSelected?.getAttribute('href')

      switch (details.soloValue) {
        case 'right':
        case 'down':
          if (selectedPath !== '/help') {
            setControllerContext('Main')
          }
          currentSelected?.click()
          break
      }
    },
    [ref.current, selected, pathname],
  )

  useControllerMoveEvent('MainMenu', (details) => {
    if (details.sameDirectionCount > 0) return
    // if (accelerationDebounced(details.sameDirectionCount)) return
    switch (details.direction) {
      case 'down':
        setSelected((s) => (s + 1) % 4)
        break
      case 'up':
        setSelected((s) => (s + 4 - 1) % 4)
        break
    }
  })

  return (
    <>
      <button
        className={styles.mainMenu.toggle}
        onClick={() => setOpen((s) => !s)}
      >
        Menu
      </button>
      <nav
        {...attributes}
        ref={ref}
        className={clsx(styles.mainMenu.root, open && styles.mainMenu.open)}
      >
        <Link
          href={`/level/${gameProgress.currentLevel}`}
          onClick={() => setOpen(false)}
          className={clsx(
            !controllers.length && styles.mainMenu.disabled,
            selected === 0 && styles.mainMenu.selected,
          )}
        >
          Continue
        </Link>
        <Link
          href={`/player`}
          className={clsx(selected === 1 && styles.mainMenu.selected)}
        >
          Players
        </Link>
        <Link
          href={`/level`}
          className={clsx(selected === 2 && styles.mainMenu.selected)}
        >
          Levels
        </Link>
        <Link
          href={`/help`}
          className={clsx(selected === 3 && styles.mainMenu.selected)}
        >
          Help
        </Link>
        <hr className={styles.mainMenu.divider} />
        <ControllerButtons styles={styles} />
        <div className={styles.mainMenu.players}>
          {controllers.map((controller) => (
            <div key={controller.id}>
              <span>{controller.id + 1} </span>
              <strong>{profiles[controller.id]?.name}</strong>
              <div>{` on ${controller.deviceName}`}</div>
            </div>
          ))}
        </div>
      </nav>
    </>
  )
}
