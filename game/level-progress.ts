import { sum } from '../util/math'
import { findNodes } from '../util/tree'
import { Component, Level } from './level'

export type LevelState = {
  tickets: Ticket[]
  codingProgress: CodingProgress
  bugs: number
}

export type Ticket = {
  component: Component
  progress: 'specified' | 'coding' | 'coded' | 'ready' | 'deployed'
  player?: number // controllerId
}

export type CodingProgress = {
  errors: boolean[]
  current: number
  indents: number[]
}

export const calculateScore = (levelProgress: LevelState) =>
  sum(
    levelProgress.tickets.filter((ticket) => ticket.progress === 'deployed'),
    (p) => p.component.codeLines.length * (p.component.forEach?.length ?? 1),
  ) - levelProgress.bugs

export const initialLevelProgress = (level: Level): LevelState => ({
  tickets: [
    {
      component: level.rootComponent,
      progress: 'deployed',
    },
  ],
  codingProgress: { current: 0, indents: [0], errors: [] },
  bugs: 0,
})

export const getNextComponents = (component: Component, tickets: Ticket[]) => [
  ...findNodes(
    component,
    (c) =>
      tickets.some(
        (t) => t.progress === 'deployed' && t.component.children?.includes(c),
      ) && !tickets.some((t) => t.component === c),
  ),
]
