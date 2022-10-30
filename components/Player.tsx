import clsx from 'clsx'
import React, { ReactNode, useEffect, useState } from 'react'
import { ButtonEvent, Controller } from '../controller/interface'
import { JoyCon } from '../controller/joy-con/joycon'
import { Point2 } from '../controller/joy-con/madgwick'
import { Profile, profiles } from '../data/profiles'
import { Level } from '../game/level'
import { LevelState } from '../game/level-progress'
import { clamp } from '../util/math'
import { DialogSelect, Styles as DialogStyles } from './DialogSelect'

export type Styles = {
  player: {
    player?: string
    playerOption?: string
    playerOptionSelected?: string
  }
} & DialogStyles

type Props = {
  controller: Controller
  level: Level
  levelProgress: LevelState
  onAction?: (event: ButtonEvent, actionZones: ActionZone[]) => void
  profile: Profile
  onChangeProfile: (profile: Profile) => void
  children?: ReactNode
  styles: Styles
} & React.HTMLAttributes<HTMLDivElement>

export type ActionZone = {
  type: ActionZoneType
  element: HTMLElement
}

type ActionZoneType =
  | 'code-editor'
  | 'ticket'
  | 'api'
  | 'commit-button'
  | 'component-slot'
  | 'vertical-scroll'
  | 'horizontal-scroll'

type PlayerState = {
  position: Point2
  actionZones: ActionZone[]
}

export const PlayerView = ({
  controller,
  level,
  levelProgress,
  profile = profiles[controller.id],
  onChangeProfile,
  onAction,
  children,
  styles,
  ...attributes
}: Props) => {
  const [state, setState] = useState<PlayerState>({
    actionZones: [],
    position: {
      x: 100 + 100 * controller.id,
      y: 0,
    },
  })
  const [openDialog, setOpenDialog] = useState(false)

  const color = playerColor[controller.id]

  useEffect(() => {
    if (openDialog) return

    controller.onPosition = ({ position }) =>
      setState((s) => ({ ...s, position }))

    controller.onButton = (event) => {
      switch (event.soloValue) {
        case 'special': {
          if (!event.changed) return
          setOpenDialog((b) => !b)
          break
        }
        default: {
          onAction?.(event, state.actionZones)
        }
      }
    }

    controller.onMove = ({ move }) =>
      setState((state) => {
        const speed = controller instanceof JoyCon ? 8 : 1

        const position = getNewPosition(state.position, move, speed)

        const actionZones = getActionZoneElements(position)

        removeExistingHover(color)

        actionZones.forEach((actionZone) => addHover(actionZone, color))

        return { ...state, actionZones, position }
      })

    return () => {
      controller.onButton = undefined
      controller.onPosition = undefined
      controller.onMove = undefined
    }
  }, [openDialog, state.actionZones])

  return (
    <div {...attributes}>
      <div
        className={styles.player.player}
        style={{
          color,
          top: `${state.position.y}px`,
          left: `${state.position.x}px`,
          backgroundImage: `url(${profile.img}`,
        }}
      >
        {children}
      </div>
      <DialogSelect
        current={profile}
        open={openDialog}
        controller={controller}
        options={profiles}
        style={{ borderColor: color }}
        styles={styles}
        buildOptionNode={(option, selected) => (
          <div
            className={clsx(
              styles.player.playerOption,
              selected && styles.player.playerOptionSelected,
            )}
          >
            <img src={option.img} />
            <div>{option.name}</div>
          </div>
        )}
        getOptionValue={(option) => option.name}
        onSubmit={(profile) => {
          onChangeProfile(profile)
          setOpenDialog(false)
        }}
      />
    </div>
  )
}

export const playerColor = ['red', 'blue', 'green', 'yellow']

const getActionZoneElements = (position: Point2): ActionZone[] =>
  (document.elementsFromPoint(position.x, position.y) as HTMLElement[])
    .filter((e) => e.dataset.actionZone)
    .map((element) => ({
      element,
      type: element?.dataset.actionZone as ActionZoneType,
    }))

const removeExistingHover = (color: string) => {
  document
    .querySelectorAll<HTMLElement>(`.hover.${color}`)
    .forEach((existingHover) => {
      existingHover.classList.remove('hover', color)
      existingHover.style.removeProperty('--player-color')
      if (
        existingHover.dataset.actionZone === 'ticket' &&
        existingHover.parentElement
      ) {
        existingHover.parentElement.style.zIndex = ''
      }
    })
}

const addHover = (actionZone: ActionZone, color: string) => {
  switch (actionZone.type) {
    case 'component-slot': {
      actionZone.element.classList.add('hover', color)
      actionZone.element.style.setProperty('--player-color', color)
    }
    case 'ticket': {
      actionZone.element.classList.add('hover', color)
      actionZone.element.style.setProperty('--player-color', color)
      actionZone.element.parentElement!.style.zIndex = '1'
      break
    }
    case 'commit-button': {
      actionZone.element.classList.add('hover', color)
      break
    }
    case 'api': {
      actionZone.element.classList.add('hover', color)
      actionZone.element.style.setProperty('--player-color', color)
      break
    }
  }
}

// const vw = window.innerWidth * 0.01

const getNewPosition = (
  position: Point2,
  move: Point2,
  speed: number,
  vw = window.innerWidth * 0.01,
) => ({
  x: clamp(position.x + move.x * speed, 4 * vw, 96 * vw),
  y: clamp(position.y + move.y * speed, 0, window.innerHeight - 10 * vw),
})
