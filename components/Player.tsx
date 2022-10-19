import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import { Profile, profiles } from '../data/profiles'
import { accelerationDebounced } from '../joy-con/events'
import { clamp, JoyCon } from '../joy-con/joycon'
import { Point2 } from '../joy-con/madgwick'
import { Level } from '../lib/level'
import { ComponentProgress, LevelProgress } from '../lib/level-progress'
import { CodedComponent } from './CodedComponent'
import { CodeAction } from './CodeEditor'
import { DialogSelect } from './DialogSelect'
import styles from './Player.module.css'

type Props = {
  controller: JoyCon
  level: Level
  levelProgress: LevelProgress
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

type ActionZone = 'code-editor' | 'object' | 'cms' | 'browser'

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

  useEffect(() => {
    if (openDialog) return

    controller.onButton = ({ soloValue, changed, sameButtonCount }) => {
      if (accelerationDebounced(sameButtonCount)) return

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
            case 'object': {
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
            case 'object': {
              if (!state.componentProgress) {
                const { actionZone } = getActionZoneElement(state.position)
                const componentId =
                  actionZone?.firstElementChild?.getAttribute('component-id')
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
                      -1016,
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
    controller.onJoystick = ({ value }) => {
      const speed = 8
      const vw = window.innerWidth * 0.01

      const position = {
        x: clamp(state.position.x + value.x * speed, 4 * vw, 96 * vw),
        y: clamp(
          state.position.y + value.y * speed,
          0,
          window.innerHeight - 10 * vw,
        ),
      }

      const color = playerColor[controller.id]

      const { actionZone, hoverElements } = getActionZoneElement(position)

      const classList = actionZone?.classList
      const zone: ActionZone | undefined = classList?.contains('code-editor')
        ? 'code-editor'
        : classList?.contains('browser')
        ? 'browser'
        : classList?.contains('object')
        ? 'object'
        : undefined

      const existingHover = document.querySelector<HTMLElement>(
        `.hover.${color}`,
      )
      if (existingHover) {
        existingHover.classList.remove('hover', color)
        existingHover.style.removeProperty('--player-color')
      }

      if (zone && actionZone) {
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
          case 'object': {
            actionZone.classList.add('hover', color)
            actionZone.style.setProperty('--player-color', color)
            break
          }
        }
      }

      setState((s) => ({ ...s, zone, position }))
    }
  }, [controller, openDialog, state, level, levelProgress])

  return (
    <div {...attributes}>
      <div
        className={styles.player}
        style={{
          color: playerColor[controller.id],
          top: `${state.position.y}px`,
          left: `${state.position.x}px`,
          backgroundImage: `url(${profile.img}`,
        }}
      >
        {state.componentProgress && (
          <CodedComponent
            component={state.componentProgress.component}
            rotation={-0.4}
            className={styles.currentComponent}
          />
        )}
      </div>
      <DialogSelect
        current={profile}
        open={openDialog}
        controller={controller}
        options={profiles}
        style={{ borderColor: playerColor[controller.id] }}
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

  return {
    actionZone: hoverElements.find((e) => e.classList.contains('action-zone')),
    hoverElements,
  }
}
