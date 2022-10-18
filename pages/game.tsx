import clsx from 'clsx'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import { Browser } from '../components/Browser'
import { CodeEditor } from '../components/CodeEditor'
import { PlayerGame } from '../components/Player'
import { Profile, profiles } from '../data/profiles'
import { useControllers } from '../hooks/useControllers'
import { clamp } from '../joy-con/joycon'
import { Level, readLevelFile } from '../lib/level'
import { LevelProgress } from '../lib/level-progress'
import styles from './game.module.css'

type Props = {
  level: Level
}

export default function Web({ level }: Props) {
  const [controllers, requestNewJoyCon] = useControllers()
  const [levelProgress, setLevelProgress] = useState<LevelProgress>({
    componentsProgress: level.allComponents.map((component, i) => ({
      component,
      progress: i === 0 ? 'deployed' : 'ticket',
    })),
    codingProgress: { current: 0, indents: [0], errors: [] },
  })
  const [controllerProfiles, setProfiles] = useState<Profile[]>([])

  const baseFreq = 40.875885

  return (
    <div className={styles.app}>
      <Head>
        {level.styles.map((style, i) => (
          <link key={i} rel="stylesheet" href={style} />
        ))}
      </Head>

      <header>
        <button
          className={clsx(styles.connect)}
          type="button"
          onClick={requestNewJoyCon}
        >
          Connect Joy-Con
        </button>
        <div>
          {controllers.map((controller) => (
            <div key={controller.id}>
              {`[${controller.id}] ${
                controllerProfiles[controller.id]?.name ??
                profiles[controller.id]?.name
              } on ${controller.device.productName}`}
            </div>
          ))}
        </div>
      </header>

      {levelProgress.componentsProgress
        .filter((p) => p.progress === 'coded')
        .map(({ component }, i, a) => (
          <div
            className={clsx(
              styles.codedComponent,
              'action-zone',
              'object',
              'coded-component',
            )}
            style={{ left: `${50 - (a.length - i) * 5}vw` }}
            key={component.id}
            dangerouslySetInnerHTML={{ __html: component.html }}
          />
        ))}

      <Browser
        level={level}
        progress={levelProgress}
        className={styles.level}
      />

      <CodeEditor levelProgress={levelProgress} />

      <div className={styles.playerContainer}>
        {controllers.map((controller) => (
          <PlayerGame
            key={controller.id}
            profile={controllerProfiles[controller.id]}
            onChangeProfile={(p) => {
              controllerProfiles[controller.id] = p
              setProfiles([...controllerProfiles])
            }}
            controller={controller}
            onChangeComponentProgress={(componentProgress, progress) => {
              setLevelProgress((p) => {
                componentProgress.progress = progress
                return {
                  ...p,
                }
              })
            }}
            onDropComponent={(componentProgress, dropZone) =>
              setLevelProgress((p) => {
                const dropZoneComponentId =
                  dropZone.getAttribute('component-id')!

                if (dropZoneComponentId === componentProgress.component.id) {
                  componentProgress.progress = 'deployed'
                  dropZone.classList.remove('drop-zone')
                  dropZone.outerHTML = componentProgress.component.html
                } else {
                  componentProgress.progress = 'coded'
                }
                return {
                  ...p,
                }
              })
            }
            onChangeCode={(action) => {
              switch (action) {
                case 'indent-left': {
                  setLevelProgress((state) => {
                    const { indents, errors, current } = state.codingProgress

                    indents[current] = Math.max(0, indents[current] - 1)
                    errors[current] = false

                    return { ...state }
                  })
                  break
                }
                case 'indent-right': {
                  setLevelProgress((state) => {
                    const { indents, errors, current } = state.codingProgress

                    indents[current] = Math.min(10, indents[current] + 1)
                    errors[current] = false

                    return {
                      ...state,
                      codingProgress: {
                        indents: [...indents],
                        current,
                        errors: [...errors],
                      },
                    }
                  })
                  break
                }
                case 'line-up': {
                  setLevelProgress((state) => ({
                    ...state,
                    codingProgress: {
                      ...state.codingProgress,
                      current: Math.max(0, state.codingProgress.current - 1),
                    },
                  }))
                  break
                }
                case 'line-down': {
                  setLevelProgress((state) => {
                    const ticket = state.componentsProgress.find(
                      (c) => c.progress === 'ticket',
                    )
                    if (!ticket) return state

                    const { current, indents } = state.codingProgress
                    const isCommit =
                      current === ticket.component.structure.length
                    if (isCommit) {
                      const errors = state.codingProgress.indents.map(
                        (indent, i) =>
                          indent !== ticket.component.structure[i].indent,
                      )
                      const isValid = errors.every((error) => !error)

                      if (isValid) {
                        ticket.progress = 'coded'
                        state.codingProgress.indents = [0]
                        state.codingProgress.current = 0
                        state.codingProgress.errors = []
                      } else {
                        state.codingProgress.errors = errors
                      }
                      return { ...state }
                    }
                    return {
                      ...state,
                      codingProgress: {
                        ...state.codingProgress,
                        indents:
                          current === indents.length - 1 &&
                          indents.length < ticket.component.structure.length
                            ? [...indents, indents[indents.length - 1]]
                            : indents,
                        current: clamp(
                          0,
                          current + 1,
                          ticket.component.structure.length,
                        ),
                      },
                    }
                  })
                  break
                }
              }
            }}
            levelProgress={levelProgress}
            level={level}
          />
        ))}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({}) => {
  const level = await readLevelFile('agradi-homepage')

  return {
    props: {
      level,
    },
  }
}
