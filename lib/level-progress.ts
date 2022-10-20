import { shuffle } from './collection'
import { Component, Level } from './level'
import { clamp, sum } from './math'
import { randomSeed } from './random'
import { findNodes } from './tree'

const seed = 0
const random = randomSeed(seed)

export type LevelState = {
  componentsProgress: ComponentProgress[]
  codingProgress: CodingProgress
  bugs: number
}

export type ComponentProgress = {
  component: Component
  progress:
    | 'specified'
    | 'coded'
    | 'grabbed'
    | 'cms-filled'
    | 'api-filled'
    | 'ready'
    | 'deployed'
}

export type CodingProgress = {
  errors: boolean[]
  current: number
  indents: number[]
}

export const calculateScore = (levelProgress: LevelState) =>
  sum(
    levelProgress.componentsProgress.filter((f) => f.progress === 'deployed'),
    (p) => p.component.structure.length,
  ) - levelProgress.bugs

export const initialLevelProgress = (level: Level): LevelState => ({
  componentsProgress: [
    {
      component: level.rootComponent,
      progress: 'deployed',
    },
  ],
  codingProgress: { current: 0, indents: [0], errors: [] },
  bugs: 0,
})

export const getNextComponents = (
  component: Component,
  componentsProgress: ComponentProgress[],
) => [
  ...findNodes(
    component,
    (c) =>
      componentsProgress.some(
        (p) => p.progress === 'deployed' && p.component.children?.includes(c),
      ) && !componentsProgress.some((p) => p.component === c),
  ),
]

export function changeIndent(state: LevelState, change: number) {
  const { indents, errors, current } = state.codingProgress
  const ticket = state.componentsProgress.find(
    (c) => c.progress === 'specified',
  )
  if (ticket && current < ticket?.component.structure.length) {
    indents[current] = clamp(indents[current] + change, 0, 10)
    errors[current] = false
  }
}

export function addIndent(state: LevelState) {
  const { indents } = state.codingProgress
  indents.push(indents[indents.length - 1])
}

export function deploy(
  state: LevelState,
  level: Level,
  ticket: ComponentProgress,
  dropZone: Element,
) {
  ticket.progress = 'deployed'
  dropZone.classList.remove('drop-zone')
  dropZone.lastElementChild?.remove()
  dropZone.outerHTML = ticket.component.html

  const existingSpecified = state.componentsProgress
    .filter((p) => p.progress === 'specified')
    .slice(1)
  state.componentsProgress = [
    ...state.componentsProgress.filter((p) => !existingSpecified.includes(p)),
    ...shuffle(
      [
        ...existingSpecified,
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
  ]
}

export const ticketValidation = (
  state: LevelState,
  ticket: ComponentProgress,
) => {
  const errors = ticket.component.structure.map(
    ({ indent }, i) => indent !== state.codingProgress.indents[i],
  )
  const isValid = errors.every((error) => !error)
  return { isValid, errors }
}

export function commit(state: LevelState, ticket: ComponentProgress) {
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
