'use client'
import clsx from 'clsx'
import Image from 'next/image'
import { HTMLAttributes, useEffect, useRef } from 'react'
import { profiles } from '../data/profiles'
import { useProfiles } from '../hooks/useProfiles'
import { PlayerEvent, PlayerStyles } from './Player'

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

  useEffect(() => {
    const handler = (event: Event) => {
      const details = (event as CustomEvent).detail as PlayerEvent

      const index = [...(ref.current?.children ?? [])].indexOf(
        event.target as HTMLElement,
      )
      setProfile(details.controllerId, profiles[index].name)
    }
    ref.current?.addEventListener('player-button', handler, true)
    return () => {
      ref.current?.removeEventListener('player-button', handler, true)
    }
  }, [ref.current])

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
          className={styles.profiles.profile}
          data-action-zone="selectable"
        >
          <div>
            <Image src={p.img} alt={p.name} fill sizes="8rem" />
          </div>
          <span>{p.name.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  )
}
