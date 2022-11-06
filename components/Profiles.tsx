'use client'
import clsx from 'clsx'
import Image from 'next/image'
import { CSSProperties, HTMLAttributes, useRef } from 'react'
import { profiles } from '../data/profiles'
import { usePlayerEvent } from '../hooks/usePlayerEvent'
import { useProfiles } from '../hooks/useProfiles'
import { playerColor, PlayerStyles } from './Player'

export type Styles = {
  profiles: {
    profile?: string
    root?: string
  }
} & PlayerStyles

type Props = {
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export const Profiles = ({ styles, ...attributes }: Props) => {
  const [userProfiles, setProfile] = useProfiles()
  const ref = useRef<HTMLDivElement>(null)

  usePlayerEvent(ref.current, (details, event) => {
    if (details.event.soloValue !== 'right') {
      return
    }
    event.stopPropagation()
    const target = event.target as HTMLElement
    const index = [...(ref.current?.children ?? [])].indexOf(target)
    setProfile(details.controllerId, profiles[index]?.name)
  })

  return (
    <div
      ref={ref}
      {...attributes}
      className={clsx(styles.profiles.root)}
      data-action-zone="vertical-scroll"
    >
      {profiles.map((p) => (
        <button
          key={p.name}
          className={clsx(
            styles.profiles.profile,
            userProfiles.includes(p) && styles.profiles.profile,
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
  )
}
