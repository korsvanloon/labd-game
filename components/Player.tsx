import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import { Profile, profiles } from '../data/profiles'
import { accelerationDebounced } from '../joy-con/events'
import { clamp, JoyCon } from '../joy-con/joycon'
import { Point2 } from '../joy-con/madgwick'
import { Component, Level, LevelProgress } from '../lib/level'
import { DialogSelect } from './DialogSelect'
import styles from './Player.module.css'

type Props = {
  controller: JoyCon
  level: Level
  levelProgress: LevelProgress
  onDropComponent: (component: Component, dropZoneComponentId: string) => void
  profile: Profile
  onChangeProfile: (profile: Profile) => void
} & React.HTMLAttributes<HTMLDivElement>

const scrollStep = 200

export const PlayerGame = ({
  controller,
  level,
  levelProgress,
  onDropComponent,
  profile = profiles[controller.id],
  onChangeProfile,
  ...attributes
}: Props) => {
  const [currentComponent, setCurrentComponent] = useState<Component>()
  const [playerPosition, setPlayerPosition] = useState<Point2>({
    x: 100 + 100 * controller.id,
    y: 0,
  })
  const [openDialog, setOpenDialog] = useState(false)

  useEffect(() => {
    if (openDialog) return

    controller.onButton = ({ soloValue, changed, sameButtonCount }) => {
      switch (soloValue) {
        case 'special': {
          if (!changed) return
          setOpenDialog((b) => !b)
          break
        }
        case 'up': {
          if (accelerationDebounced(sameButtonCount)) return

          const scrollable = document
            .elementsFromPoint(playerPosition.x, playerPosition.y)
            .find((e) => e.classList.contains('scrollable'))
          scrollable?.scrollBy({ top: -scrollStep })
          break
        }
        case 'down': {
          if (accelerationDebounced(sameButtonCount)) return
          const scrollable = document
            .elementsFromPoint(playerPosition.x, playerPosition.y)
            .find((e) => e.classList.contains('scrollable'))
          scrollable?.scrollBy({ top: scrollStep })
          break
        }
        case 'left': {
          if (!changed) return

          if (!currentComponent) {
            const doneComponents = levelProgress.componentsDone
            const newComponent = level.allComponents.find(
              (c) => !Object.values(doneComponents).includes(c.id),
            )
            if (newComponent) {
              setCurrentComponent(newComponent)
            }
          } else {
            setCurrentComponent(undefined)
          }
          break
        }
        case 'right': {
          if (!changed) return

          const dropZone = document
            .elementsFromPoint(playerPosition.x, playerPosition.y)
            .find((e) => e.classList.contains('drop-zone'))

          if (currentComponent && dropZone) {
            dropZone.classList.remove('drop-zone')
            dropZone.outerHTML = currentComponent.html
            const dropZoneComponentId = dropZone.getAttribute('component-id')!
            onDropComponent(currentComponent, dropZoneComponentId)
            setCurrentComponent(undefined)
          }
          break
        }
      }
    }
    controller.onJoystick = ({ value }) => {
      const speed = 8
      const vw = window.innerWidth * 0.01

      const position = {
        x: clamp(playerPosition.x + value.x * speed, 4 * vw, 96 * vw),
        y: clamp(
          playerPosition.y + value.y * speed,
          0,
          window.innerHeight - 10 * vw,
        ),
      }

      setPlayerPosition(position)
      const color = playerColor[controller.id]

      document
        .querySelector(`.hover.${color}`)
        ?.classList.remove('hover', color)

      const dropZone = document
        .elementsFromPoint(position.x, position.y)
        .find((e) => e.classList.contains('drop-zone'))

      if (dropZone) {
        dropZone.classList.add('hover', color)
      }
    }
  }, [
    controller,
    openDialog,
    playerPosition,
    currentComponent,
    level,
    levelProgress,
  ])

  return (
    <div {...attributes}>
      <div
        className={styles.player}
        style={{
          color: playerColor[controller.id],
          top: `${playerPosition.y}px`,
          left: `${playerPosition.x}px`,
          backgroundImage: `url(${profile.img}`,
        }}
      >
        {currentComponent && (
          <div
            className={styles.currentComponent}
            dangerouslySetInnerHTML={{ __html: currentComponent.html }}
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
            className={clsx(styles.payerOption, selected && styles.selected)}
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
