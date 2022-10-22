import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import { Controller } from '../controller/interface'
import { Profile, profiles } from '../data/profiles'
import { Level } from '../game/level'
import { ComponentProgress, LevelState } from '../game/level-progress'
import { JoyCon } from '../joy-con/joycon'
import { Point2 } from '../joy-con/madgwick'
import { clamp } from '../util/math'
import { CodeAction } from './CodeEditor'
import { DialogSelect } from './DialogSelect'
import styles from './Player.module.css'
import { Ticket } from './Ticket'

type Props = {
  controller: Controller
  level: Level
  levelProgress: LevelState
  onDropComponent: (component: ComponentProgress, dropZone: Element) => void
  onChangeComponentProgress: (
    component: ComponentProgress,
    progress: ComponentProgress['progress'],
  ) => void
  profile: Profile
  onChangeProfile: (profile: Profile) => void
  onChangeCode: (action: CodeAction) => void
} & React.HTMLAttributes<HTMLDivElement>

const scrollStep = 200

type ActionZone = 'code-editor' | 'ticket' | 'cms' | 'browser' | 'commit-button'

type PlayerState = {
  position: Point2
  componentProgress?: ComponentProgress
  zone?: ActionZone
}

export const Player = ({
  controller,
  level,
  levelProgress,
  onDropComponent,
  onChangeComponentProgress,
  profile = profiles[controller.id],
  onChangeProfile,
  onChangeCode,
  ...attributes
}: Props) => {
  const [state, setState] = useState<PlayerState>({
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

    controller.onButton = ({ soloValue, changed }) => {
      switch (soloValue) {
        case 'special': {
          if (!changed) return
          setOpenDialog((b) => !b)
          break
        }
        case 'up': {
          switch (state.zone) {
            case 'browser': {
              const scrollable = document
                .elementsFromPoint(state.position.x, state.position.y)
                .find((e) => e.classList.contains('scrollable'))
              scrollable?.scrollBy({ top: -scrollStep })
              break
            }
            case 'code-editor': {
              onChangeCode('line-up')
              break
            }
          }
          break
        }
        case 'down': {
          switch (state.zone) {
            case 'browser': {
              const scrollable = document
                .elementsFromPoint(state.position.x, state.position.y)
                .find((e) => e.classList.contains('scrollable'))
              scrollable?.scrollBy({ top: scrollStep })
              break
            }
            case 'code-editor': {
              onChangeCode('line-down')
              break
            }
          }
          break
        }
        case 'left': {
          switch (state.zone) {
            case 'ticket': {
              if (!changed) return

              if (state.componentProgress) {
                onChangeComponentProgress(state.componentProgress, 'coded')
                setState((s) => ({ ...s, componentProgress: undefined }))
              }
              break
            }
            case 'code-editor': {
              onChangeCode('indent-left')
              break
            }
            case 'browser': {
              const scrollable = (
                document.elementsFromPoint(
                  state.position.x,
                  state.position.y,
                ) as HTMLElement[]
              ).find((e) => e.classList.contains('horizontal-scrollable'))
              if (scrollable) {
                if (getComputedStyle(scrollable).overflowX !== 'visible') {
                  scrollable?.scrollBy({ left: -scrollStep })
                } else {
                  scrollable.style.marginLeft = `${Math.max(
                    0,
                    parseInt(scrollable.style.marginLeft || '0') - scrollStep,
                  )}px`
                }
              }
              break
            }
            default: {
              if (!changed) return
              if (state.componentProgress) {
                onChangeComponentProgress(state.componentProgress, 'coded')
                setState((s) => ({ ...s, componentProgress: undefined }))
              }
              break
            }
          }
          break
        }
        case 'right': {
          switch (state.zone) {
            case 'ticket': {
              if (!state.componentProgress) {
                const { actionZoneElement: actionZone } = getActionZoneElement(
                  state.position,
                )
                const componentId = actionZone?.dataset.componentId
                if (!componentId) return

                const componentProgress = levelProgress.componentsProgress.find(
                  (p) => p.component.id === componentId,
                )

                if (componentProgress) {
                  onChangeComponentProgress(componentProgress, 'grabbed')
                  setState((s) => ({ ...s, componentProgress }))
                }
              }
              break
            }
            case 'commit-button': {
              onChangeCode('commit')
              break
            }
            case 'browser': {
              if (!changed) return
              const dropZone = document
                .elementsFromPoint(state.position.x, state.position.y)
                .find((e) => e.classList.contains('drop-zone'))

              if (state.componentProgress && dropZone) {
                onDropComponent(state.componentProgress, dropZone)
                setState((s) => ({ ...s, componentProgress: undefined }))
              } else {
                const scrollable = (
                  document.elementsFromPoint(
                    state.position.x,
                    state.position.y,
                  ) as HTMLElement[]
                ).find((e) => e.classList.contains('horizontal-scrollable'))
                if (scrollable) {
                  if (getComputedStyle(scrollable).overflowX !== 'visible') {
                    scrollable?.scrollBy({ left: +scrollStep })
                  } else {
                    scrollable.style.marginLeft = `${Math.max(
                      -1200,
                      parseInt(scrollable.style.marginLeft || '0') - scrollStep,
                    )}px`
                  }
                }
              }
              break
            }
            case 'code-editor': {
              onChangeCode('indent-right')
              break
            }
          }
          break
        }
      }
    }
    controller.onMove = ({ move }) =>
      setState((state) => {
        const speed = controller instanceof JoyCon ? 8 : 1

        const position = getNewPosition(state.position, move, speed)

        const { actionZoneElement, zone, hoverElements } =
          getActionZoneElement(position)

        removeExistingHover(color)

        if (zone && actionZoneElement) {
          switch (zone) {
            case 'browser': {
              if (state.componentProgress) {
                const dropZone = hoverElements.find((e) =>
                  e.classList.contains('drop-zone'),
                )

                if (dropZone) {
                  dropZone.classList.add('hover', color)
                  dropZone.style.setProperty('--player-color', color)
                }
              }
              break
            }
            case 'ticket': {
              actionZoneElement.classList.add('hover', color)
              actionZoneElement.style.setProperty('--player-color', color)
              actionZoneElement.parentElement!.style.zIndex = '1'
              break
            }
            case 'commit-button': {
              actionZoneElement.classList.add('hover', color)
              break
            }
          }
        }

        return { ...state, zone, position }
      })
  }, [controller, openDialog, state, level, levelProgress])

  return (
    <div {...attributes}>
      <div
        className={styles.player}
        style={{
          color,
          top: `${state.position.y}px`,
          left: `${state.position.x}px`,
          backgroundImage: `url(${profile.img}`,
        }}
      >
        {state.componentProgress && (
          <Ticket
            component={state.componentProgress.component}
            rotation={-0.4}
            className={styles.ticket}
            componentClassName={styles.component}
          />
        )}
      </div>
      <DialogSelect
        current={profile}
        open={openDialog}
        controller={controller}
        options={profiles}
        style={{ borderColor: color }}
        getOptionNode={(option, selected) => (
          <div
            className={clsx(styles.playerOption, selected && styles.selected)}
          >
            <img src={option.img} className={styles.playerOptionImg} />
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

const getActionZoneElement = (position: Point2) => {
  const hoverElements = document.elementsFromPoint(
    position.x,
    position.y,
  ) as HTMLElement[]

  const actionZoneElement = hoverElements.find((e) => e.dataset['actionZone'])

  const zone = actionZoneElement?.dataset['actionZone'] as
    | ActionZone
    | undefined

  return {
    zone,
    actionZoneElement,
    hoverElements,
  }
}

const removeExistingHover = (color: string) => {
  const existingHover = document.querySelector<HTMLElement>(`.hover.${color}`)
  if (existingHover) {
    existingHover.classList.remove('hover', color)
    existingHover.style.removeProperty('--player-color')
    if (
      existingHover.dataset.actionZone === 'ticket' &&
      existingHover.parentElement
    ) {
      existingHover.parentElement.style.zIndex = ''
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
