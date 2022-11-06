'use client'
import clsx from 'clsx'
import { HTMLAttributes } from 'react'
import { useControllers } from '../hooks/useControllers'
import { useProfiles } from '../hooks/useProfiles'
import { PlayerStyles, PlayerView } from './Player'

export type PlayersStyles = {
  players: { root?: string }
} & PlayerStyles

type Props = {
  styles: PlayersStyles
} & HTMLAttributes<HTMLDivElement>

export const Players = ({ styles, ...attributes }: Props) => {
  const { controllers } = useControllers()
  const [profiles] = useProfiles()
  // const items = useItems()
  return (
    <div {...attributes} className={clsx(styles.players.root)}>
      {controllers.map((controller) => (
        <PlayerView
          key={controller.id}
          controller={controller}
          profile={profiles[controller.id]}
          styles={styles}
        >
          {/* {items[controller.id]} */}
        </PlayerView>
      ))}
    </div>
  )
}
