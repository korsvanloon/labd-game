'use client'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { HTMLAttributes, useEffect, useRef, useState } from 'react'
import {
  useControllerButtonEvent,
  useControllerMoveEvent,
  useControllers,
} from '../hooks/useControllers'
import useLocalStorage from '../hooks/useLocalStorage'
import { useProfiles } from '../hooks/useProfiles'
import { isValue } from '../util/collection'
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

export const MainMenu = ({ styles, ...attributes }: Props) => {
  const pathname = usePathname()
  const [open, setOpen] = useState(!pathname?.includes('level/'))
  const [profiles] = useProfiles()
  const { context, controllers, setControllerContext } = useControllers()
  const [selected, setSelected] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [currentLevel] = useLocalStorage<string>('currentLevel')

  const menuItems = [
    currentLevel ? { label: 'continue', href: currentLevel } : undefined,
    ...staticMenuItems,
  ]

  useEffect(() => {
    if (!open) return
    if (context[0] !== 'MainMenu') {
      setControllerContext('MainMenu')
    }
  }, [open])

  useEffect(() => {
    if (context[0] === 'MainMenu') {
      setOpen(true)
    }
  }, [context])

  useEffect(() => {
    if (pathname?.includes('level/')) {
      setOpen(false)
    }
  }, [pathname])

  useControllerButtonEvent(
    'MainMenu',
    (details) => {
      if (details.sameButtonCount > 0) return

      const currentSelected = ref.current?.querySelectorAll('a').item(selected)
      const selectedPath = currentSelected?.getAttribute('href')

      switch (details.soloValue) {
        case 'special': {
          router.push(staticMenuItems[0].href)
          setControllerContext('Main')
          setOpen(false)
          break
        }
        case 'right':
        case 'down':
          if (selected === 0) {
            setOpen(false)
          }
          if (selectedPath !== '/help') {
            setControllerContext('Main')
          }
          if (selectedPath) {
            router.push(selectedPath)
          }
          break
      }
    },
    [ref.current, selected, pathname],
  )

  useControllerMoveEvent('MainMenu', (details) => {
    if (details.sameDirectionCount > 0) return
    const n = menuItems.length
    switch (details.direction) {
      case 'down':
        setSelected((s) => (s + 1) % n)
        break
      case 'up':
        setSelected((s) => (s + n - 1) % n)
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
        {menuItems.filter(isValue).map(({ href, label }, i) => (
          <Link
            key={i}
            href={href}
            className={clsx(
              !controllers.length && styles.mainMenu.disabled,
              selected === i && styles.mainMenu.selected,
            )}
          >
            {label}
            {selected === i ? (
              context[0] === 'Main' ? (
                <kbd data-key="left">left</kbd>
              ) : (
                <kbd data-key="right">right</kbd>
              )
            ) : undefined}
          </Link>
        ))}
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

const staticMenuItems = [
  {
    href: `/player`,
    label: 'Profiles',
  },
  {
    href: `/level`,
    label: 'Levels',
  },
  {
    href: `/help`,
    label: 'Help',
  },
]
