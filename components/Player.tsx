'use client'
import React, { ReactNode, useEffect, useState } from 'react'
import { ButtonEvent, Controller } from '../controller/interface'
import { accelerationDebounced } from '../controller/joy-con/events'
import { JoyCon } from '../controller/joy-con/joycon'
import { Point2 } from '../controller/joy-con/madgwick'
import { Profile } from '../data/profiles'
import { ControllerContext } from '../game/controller-context'
import { clamp } from '../util/math'

export type PlayerStyles = {
  player: {
    player?: string
    playerOption?: string
    playerOptionSelected?: string
  }
}

type Props = {
  controller: Controller<ControllerContext>
  profile?: Profile
  children?: ReactNode
  styles: PlayerStyles
} & React.HTMLAttributes<HTMLDivElement>

export type ActionZone = {
  type: ActionZoneType
  element: HTMLElement
}

type ActionZoneType =
  | 'level'
  | 'code-editor'
  | 'ticket'
  | 'api'
  | 'commit-button'
  | 'component-slot'
  | 'vertical-scroll'
  | 'horizontal-scroll'
  | 'set-workspace'

type PlayerState = {
  position?: Point2
  actionZones: ActionZone[]
}

export type PlayerEvent = {
  controllerId: number
  event: ButtonEvent
  actionZones: ActionZone[]
}

export const PlayerView = ({
  controller,
  profile,
  children,
  styles,
  ...attributes
}: Props) => {
  const [state, setState] = useState<PlayerState>({
    actionZones: [],
    position: controller.initialPosition,
  })
  const color = playerColor[controller.id]

  useEffect(() => {
    controller.addPositionListener('Main', ({ position }) => {
      return setState((s) => ({ ...s, position }))
    })

    controller.addButtonListener('Main', (event) => {
      if (event.sameButtonCount > 0) {
        return
      }
      const actionZone = state.actionZones[0]
      if (!actionZone) return
      actionZone.element.dispatchEvent(
        new CustomEvent('player-button', {
          detail: {
            controllerId: controller.id,
            event,
            actionZones: state.actionZones,
          },
        }),
      )
      if (
        (actionZone.element instanceof HTMLAnchorElement ||
          actionZone.element instanceof HTMLButtonElement) &&
        event.soloValue === 'right'
      ) {
        actionZone.element.click()
      }
    })

    controller.addMoveListener('Main', ({ move, sameDirectionCount }) => {
      if (accelerationDebounced(sameDirectionCount, 0.4, 32)) {
        return
      }
      return setState((state) => {
        if (!state.position) {
          return state
        }
        const speed = controller instanceof JoyCon ? 2 : 1

        const position = getNewPosition(state.position, move, speed)

        const actionZones = getActionZoneElements(position)

        removeExistingHover(color)

        actionZones.forEach((actionZone) => addHover(actionZone, color))

        return { ...state, actionZones, position }
      })
    })

    return () => {
      const x = () => {}
      controller.removeButtonListener(x)
      controller.removePositionListener(x)
      controller.removeMoveListener(x)
    }
  }, [state.actionZones])

  return (
    <div {...attributes}>
      <div
        className={styles.player.player}
        style={{
          color,
          visibility: state.position ? 'visible' : 'hidden',
          top: `${state.position?.y}px`,
          left: `${state.position?.x}px`,
          backgroundImage: profile ? `url(${profile.img}` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export const playerColor = ['red', 'blue', 'green', 'yellow']

const getActionZoneElements = (position: Point2): ActionZone[] =>
  (document.elementsFromPoint(position.x, position.y) as HTMLElement[])
    .filter(
      (e) =>
        e.dataset.actionZone ||
        e instanceof HTMLAnchorElement ||
        e instanceof HTMLButtonElement,
    )
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
  if (actionZone.type === 'level') return
  if (
    actionZone.element instanceof HTMLButtonElement ||
    actionZone.element instanceof HTMLAnchorElement
  ) {
    actionZone.element.classList.add('hover', color)
    actionZone.element.style.setProperty('--player-color', color)
  }
  switch (actionZone.type) {
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
    default: {
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
