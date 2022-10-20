import clsx from 'clsx'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { Browser } from '../components/Browser'
import { CodeEditor } from '../components/CodeEditor'
import { Player } from '../components/Player'
import { Profile, profiles } from '../data/profiles'
import { useControllers } from '../hooks/useControllers'
import { arrayEquals, shuffle } from '../lib/collection'
import { Component, createLevel, Level, readLevelFile } from '../lib/level'
import {
  calculateScore,
  ComponentProgress,
  getNextComponents,
  initialLevelProgress,
  LevelProgress,
} from '../lib/level-progress'
import { clamp } from '../lib/math'
import { randomSeed } from '../lib/random'
import IconJoyCon from '../public/icon-joycon.svg'
import styles from './game.module.css'

type Props = {
  level: Level
}

const seed = 0
const random = randomSeed(seed)

export default function LevelView({ level }: Props) {
  const [controllers, requestNewJoyCon] = useControllers()
  const [levelProgress, setLevelProgress] = useState<LevelProgress>(
    initialLevelProgress(level),
  )
  const [controllerProfiles, setProfiles] = useState<Profile[]>([])

  // For debugging
  useEffect(() => {
    Object.assign(window, {
      finishCoding: (amount: number = 1) =>
        setLevelProgress((p) => {
          const progresses = p.componentsProgress
            .filter((p) => p.progress === 'specified')
            .slice(0, amount)

          progresses.forEach((componentProgress) => {
            commit(componentProgress, p)
          })
          console.info(progresses.slice(-1)[0])
          return { ...p }
        }),
      deploy: (amount: number = 1) =>
        setLevelProgress((p) => {
          const progresses = p.componentsProgress
            .filter((p) => p.progress === 'coded')
            .slice(0, amount)

          progresses.forEach((componentProgress) => {
            const dropZone = findDropZone(componentProgress.component)
            deploy(componentProgress, p, level, dropZone)
          })
          console.info(progresses.slice(-1)[0])
          return { ...p }
        }),
      skip: (amount: number = 1) =>
        setLevelProgress((p) => {
          const progresses = p.componentsProgress
            .filter((p) => p.progress === 'specified')
            .slice(0, amount)

          progresses.forEach((componentProgress) => {
            const dropZone = findDropZone(componentProgress.component)
            deploy(componentProgress, p, level, dropZone)
          })
          console.info(progresses.slice(-1)[0])
          return { ...p }
        }),
    })
    // set initial progress
    setLevelProgress((p) => ({
      ...p,
      componentsProgress: [
        ...p.componentsProgress.slice(0, 5),
        ...shuffle(
          [
            ...p.componentsProgress.slice(5),
            ...getNextComponents(
              level.rootComponent,
              p.componentsProgress,
            ).map<ComponentProgress>((component) => ({
              component,
              progress: 'specified',
            })),
          ],
          random,
        ),
      ],
    }))
  }, [])

  const totalDeployed = levelProgress.componentsProgress.filter(
    (c) => c.progress === 'deployed',
  ).length

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
          <span>Connect Joy-Con</span>
          <IconJoyCon />
        </button>
        <div>
          {controllers.map((controller) => (
            <div key={controller.id}>
              {`Player ${controller.id + 1} `}
              <strong>
                {controllerProfiles[controller.id]?.name ??
                  profiles[controller.id]?.name}
              </strong>
              {` on ${controller.device.productName}`}
            </div>
          ))}
        </div>
        <div className={styles.stats}>
          <div>
            <span>Features</span>
            <strong>{`${totalDeployed} / ${level.totalComponents}`}</strong>
          </div>
          <div>
            <span>Score</span>
            <strong>{calculateScore(levelProgress)}</strong>
          </div>
        </div>
      </header>

      <Browser
        level={level}
        progress={levelProgress}
        className={styles.level}
      />

      <CodeEditor levelProgress={levelProgress} />

      <div className={styles.playerContainer}>
        {controllers.map((controller) => (
          <Player
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
                return { ...p }
              })
            }}
            onDropComponent={(componentProgress, dropZone) =>
              setLevelProgress((p) => {
                const dropZoneComponentId =
                  dropZone.getAttribute('component-id')!

                const isValid =
                  dropZoneComponentId === componentProgress.component.id

                if (isValid) {
                  deploy(componentProgress, p, level, dropZone)
                } else {
                  p.bugs += Math.ceil(
                    componentProgress.component.structure.length * 0.5,
                  )
                  controller.rumble(0, 0, 0.9)
                  componentProgress.progress = 'coded'
                }
                return { ...p }
              })
            }
            onChangeCode={(action) => {
              switch (action) {
                case 'indent-left': {
                  setLevelProgress((state) => {
                    const { indents, errors, current } = state.codingProgress

                    const ticket = state.componentsProgress.find(
                      (c) => c.progress === 'specified',
                    )
                    if (
                      ticket &&
                      current < ticket?.component.structure.length
                    ) {
                      indents[current] = Math.max(0, indents[current] - 1)
                      errors[current] = false
                    }

                    return { ...state }
                  })
                  break
                }
                case 'indent-right': {
                  setLevelProgress((state) => {
                    const { indents, errors, current } = state.codingProgress
                    const ticket = state.componentsProgress.find(
                      (c) => c.progress === 'specified',
                    )
                    if (
                      ticket &&
                      current < ticket?.component.structure.length
                    ) {
                      indents[current] = Math.min(10, indents[current] + 1)
                      errors[current] = false
                    }

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
                      (c) => c.progress === 'specified',
                    )
                    if (!ticket) return state

                    const { current, indents } = state.codingProgress
                    const isCommit =
                      current === ticket.component.structure.length

                    if (isCommit) {
                      const errors = ticket.component.structure.map(
                        ({ indent }, i) =>
                          indent !== state.codingProgress.indents[i],
                      )
                      const isValid = errors.every((error) => !error)

                      if (isValid) {
                        commit(ticket, state)
                      } else if (
                        !arrayEquals(state.codingProgress.errors, errors)
                      ) {
                        controller.rumble(0, 0, 0.9)
                        state.codingProgress.errors = errors
                        state.bugs += errors.filter((e) => e).length
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

export function deploy(
  ticket: ComponentProgress,
  state: LevelProgress,
  level: Level,
  dropZone: Element,
) {
  ticket.progress = 'deployed'
  dropZone.classList.remove('drop-zone')
  dropZone.lastElementChild?.remove()
  dropZone.outerHTML = ticket.component.html
  state.componentsProgress = [
    ...state.componentsProgress,
    ...getNextComponents(
      level.rootComponent,
      state.componentsProgress,
    ).map<ComponentProgress>((component) => ({
      component,
      progress: 'specified',
    })),
  ]
}

export function commit(ticket: ComponentProgress, state: LevelProgress) {
  ticket.progress = 'coded'
  state.codingProgress.indents = [0]
  state.codingProgress.current = 0
  state.codingProgress.errors = []
  state.componentsProgress
    .filter(
      (p) =>
        p.component.type === ticket.component.type &&
        p.progress === 'specified',
    )
    .forEach((p) => (p.progress = 'coded'))
}

const findDropZone = (component: Component) =>
  document.querySelector(`[component-id='${component.id}']`)!

export const getServerSideProps: GetServerSideProps<Props> = async ({}) => {
  const levelFile = readLevelFile('agradi-homepage')

  const htmlString = await fetch(levelFile.url).then((r) => r.text())
  const level = createLevel(htmlString, levelFile)
  return {
    props: {
      level,
    },
  }
}
