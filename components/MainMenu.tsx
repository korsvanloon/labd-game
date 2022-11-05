'use client'
import clsx from 'clsx'
import Link from 'next/link'
import { HTMLAttributes, useState } from 'react'
import { useControllers } from '../hooks/useControllers'
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
    players?: string
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
  const { controllers } = useControllers()
  const gameProgress = useGameProgress()

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
        className={clsx(styles.mainMenu.root, open && styles.mainMenu.open)}
      >
        <Link
          href={`/level/${gameProgress.currentLevel}`}
          onClick={() => setOpen(false)}
        >
          Continue
        </Link>
        <Link href={`/player`}>Players</Link>
        <Link href={`/level`}>Levels</Link>
        <Link href={`/help`}>Help</Link>
        <hr />
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
