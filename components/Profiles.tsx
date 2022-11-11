'use client'
import clsx from 'clsx'
import Image from 'next/image'
import { CSSProperties, HTMLAttributes, useRef, useState } from 'react'
import { MoveEvent } from '../controller/interface'
import { profiles } from '../data/profiles'
import {
  useControllerButtonEvent,
  useControllerMoveEvent,
  useControllers,
} from '../hooks/useControllers'
import { useProfiles } from '../hooks/useProfiles'
import { playerColor, PlayerStyles } from './Player'

export type Styles = {
  profiles: {
    profile?: string
    root?: string
    list?: string
    explanation?: string
  }
} & PlayerStyles

type Props = {
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export const Profiles = ({ styles, ...attributes }: Props) => {
  const [storedProfiles, setProfile] = useProfiles()
  const { controllers } = useControllers()
  const [ready, setReady] = useState(controllers.map(() => false))
  const ref = useRef<HTMLDivElement>(null)
  const { context, setControllerContext } = useControllers()

  const userProfiles = storedProfiles.slice(0, controllers.length)

  useControllerButtonEvent(
    'Main',
    (details) => {
      if (details.sameButtonCount > 0) return

      switch (details.soloValue) {
        case 'left':
          if (ready.every((r) => !r)) {
            setReady((rs) => rs.map(() => false))
            setControllerContext('MainMenu')
          } else {
            setReady((rs) =>
              rs.map((r, i) => (details.controllerId === i ? false : r)),
            )
          }
          break
        case 'right':
        case 'down':
          if (ready.every((r) => r)) {
            setReady((rs) => rs.map(() => false))
            setControllerContext('MainMenu')
          } else {
            setReady((rs) =>
              rs.map((r, i) => (details.controllerId === i ? true : r)),
            )
          }
          break
      }
    },
    [ready],
  )

  useControllerMoveEvent(
    'Main',
    (details) => {
      if (details.sameDirectionCount > 0) return
      // if (accelerationDebounced(details.sameDirectionCount)) return

      const rowSize = ref.current ? getRowSize(ref.current) : 5
      const currentProfile = userProfiles[details.controllerId]
      const index = currentProfile ? profiles.indexOf(currentProfile) : 0
      const offset = getOffset(details.direction, index, rowSize)

      if (offset) {
        ref.current?.children
          .item(index + offset)
          ?.scrollIntoView({ block: 'nearest' })
        setProfile(details.controllerId, profiles[index + offset].name)
      }
    },
    [ref.current, userProfiles],
  )

  return (
    <div {...attributes} className={clsx(styles.profiles.root)}>
      <div
        data-action-zone="vertical-scroll"
        className={clsx(styles.profiles.list)}
        ref={ref}
      >
        {profiles.map((p) => (
          <button
            key={p.name}
            className={clsx(
              styles.profiles.profile,
              // userProfiles.includes(p) && styles.profiles.selected,
            )}
            style={
              {
                '--color': userProfiles.includes(p)
                  ? playerColor[userProfiles.indexOf(p)]
                  : undefined,
              } as CSSProperties
            }
            data-action-zone="selectable"
          >
            <div>
              <Image
                src={p.img}
                alt={p.name}
                fill
                sizes="8rem"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk6POrBwACzwFdkSnqJQAAAABJRU5ErkJggg=="
              />
            </div>
            <span>{p.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {context[0] === 'Main' && (
        <div className={clsx(styles.profiles.explanation)}>
          <p>
            Choose a profile, press <kbd data-key="down">down</kbd> when ready.
          </p>
          <ol>
            {ready.map((r, i) => (
              <li key={i}>
                Player {i}, {r ? <strong>ready</strong> : <span>choosing</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

const getRowSize = (element: HTMLElement) => {
  const style = getComputedStyle(element)
  const childStyle = getComputedStyle(element.firstElementChild!)
  return Math.floor(
    (element.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight) -
      1) /
      (parseFloat(style.gap) + parseFloat(childStyle.width)),
  )
}

const getOffset = (
  direction: MoveEvent['direction'],
  index: number,
  rowSize: number,
) => {
  switch (direction) {
    case 'left':
      if (index - 1 > 0) {
        return -1
      }
      break
    case 'right':
      if (index + 1 < profiles.length) {
        return +1
      }
      break
    case 'down':
      if (index + rowSize < profiles.length) {
        return +rowSize
      }
      return -index + (index % rowSize)
    case 'up':
      if (index - rowSize > 0) {
        return -rowSize
      }
      break
  }
}
