import clsx from 'clsx'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { Browser } from '../components/Browser'
import { CodeAction, CodeEditor } from '../components/CodeEditor'
import { Player } from '../components/Player'
import { Profile, profiles } from '../data/profiles'
import { useControllers } from '../hooks/useControllers'
import { JoyCon } from '../joy-con/joycon'
import { arrayEquals, shuffle } from '../lib/collection'
import { Component, createLevel, Level, readLevelFile } from '../lib/level'
import {
  addIndent,
  calculateScore,
  changeIndent,
  commit,
  ComponentProgress,
  deploy,
  getNextComponents,
  initialLevelProgress,
  LevelState,
  ticketValidation,
} from '../lib/level-progress'
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
  const [levelState, setLevelState] = useState<LevelState>(
    initialLevelProgress(level),
  )
  const [controllerProfiles, setProfiles] = useState<Profile[]>([])

  // For debugging
  useEffect(() => {
    Object.assign(window, {
      finishCoding: (amount: number = 1) =>
        setLevelState((state) => {
          const progresses = state.componentsProgress
            .filter((p) => p.progress === 'specified')
            .slice(0, amount)

          progresses.forEach((componentProgress) => {
            commit(state, componentProgress)
          })
          console.info(progresses.slice(-1)[0])
          return { ...state }
        }),
      deploy: (amount: number = 1) =>
        setLevelState((state) => {
          const progresses = state.componentsProgress
            .filter((p) => p.progress === 'coded')
            .slice(0, amount)

          progresses.forEach((componentProgress) => {
            const dropZone = findDropZone(componentProgress.component)
            deploy(state, level, componentProgress, dropZone)
          })
          console.info(progresses.slice(-1)[0])
          return { ...state }
        }),
      skip: (amount: number = 1) =>
        setLevelState((state) => {
          const progresses = state.componentsProgress
            .filter((p) => p.progress === 'specified')
            .slice(0, amount)

          progresses.forEach((componentProgress) => {
            const dropZone = findDropZone(componentProgress.component)
            deploy(state, level, componentProgress, dropZone)
          })
          console.info(progresses.slice(-1)[0])
          return { ...state }
        }),
    })
    // set initial progress
    setLevelState((state) => ({
      ...state,
      componentsProgress: [
        ...state.componentsProgress.slice(0, 5),
        ...shuffle(
          [
            ...state.componentsProgress.slice(5),
            ...getNextComponents(
              level.rootComponent,
              state.componentsProgress,
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

  const totalDeployed = levelState.componentsProgress.filter(
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
            <strong>{calculateScore(levelState)}</strong>
          </div>
        </div>
      </header>

      <Browser level={level} progress={levelState} className={styles.level} />

      <CodeEditor levelProgress={levelState} />

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
              setLevelState((p) => {
                componentProgress.progress = progress
                return { ...p }
              })
            }}
            onDropComponent={(componentProgress, dropZone) =>
              setLevelState((state) => {
                const dropZoneComponentId =
                  dropZone.getAttribute('component-id')!

                const isValid =
                  dropZoneComponentId === componentProgress.component.id

                if (isValid) {
                  deploy(state, level, componentProgress, dropZone)
                } else {
                  state.bugs += Math.ceil(
                    componentProgress.component.structure.length * 0.5,
                  )
                  controller.rumble(0, 0, 0.9)
                  componentProgress.progress = 'coded'
                }
                return { ...state }
              })
            }
            onChangeCode={handleChangeCode(setLevelState, controller)}
            levelProgress={levelState}
            level={level}
          />
        ))}
      </div>
    </div>
  )
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

export const handleChangeCode = (
  setLevelState: (setter: (state: LevelState) => LevelState) => void,
  controller: JoyCon,
) =>
  function (action: CodeAction) {
    switch (action) {
      case 'indent-left': {
        setLevelState((state) => {
          changeIndent(state, -1)
          return { ...state }
        })
        break
      }
      case 'indent-right': {
        setLevelState((state) => {
          changeIndent(state, +1)
          return { ...state }
        })
        break
      }
      case 'line-up': {
        setLevelState((state) => {
          const { current } = state.codingProgress
          state.codingProgress.current = Math.max(0, current - 1)
          return { ...state }
        })
        break
      }
      case 'line-down': {
        setLevelState((state) => {
          const ticket = state.componentsProgress.find(
            (c) => c.progress === 'specified',
          )
          if (!ticket) return state

          const { current, indents } = state.codingProgress

          const isCommit = current === ticket.component.structure.length

          if (isCommit) {
            const { isValid, errors } = ticketValidation(state, ticket)

            if (isValid) {
              commit(state, ticket)
            } else if (!arrayEquals(state.codingProgress.errors, errors)) {
              controller.rumble(0, 0, 0.9)
              state.codingProgress.errors = errors
              state.bugs += errors.filter(Boolean).length
            }
          } else {
            if (
              // current is at last coded line
              current === indents.length - 1 &&
              // but there is more to code
              indents.length < ticket.component.structure.length
            ) {
              addIndent(state)
            }
            state.codingProgress.current = Math.min(
              current + 1,
              ticket.component.structure.length,
            )
          }
          return { ...state }
        })
        break
      }
    }
  }
