import { sum } from '../util/math'
import { findNodes } from '../util/tree'
import { Component, Level } from './level'

export type ActiveWorkspace = 'code-editor' | 'api'

export type LevelState = {
  tickets: Ticket[]
  bugs: number[]
  finished?: 'won' | 'lost'
  activeWorkspaces: ActiveWorkspace[]
}

export type Ticket = {
  component: Component
  progress:
    | 'specified'
    | 'coding'
    | 'coded'
    | 'api-progress'
    | 'ready'
    | 'deployed'
  codingProgress: CodingProgress
  player?: number // controllerId
  commitPlayer?: number
  deployPlayer?: number
  workspace?: number
}

export type CodingProgress = {
  errors: boolean[]
  current: number
  indents: number[]
}

export const calculateScore = (
  playerId: number,
  level: Level,
  levelProgress: LevelState,
  time: number,
) =>
  sum(
    levelProgress.tickets.filter(
      (ticket) =>
        ticket.component.id !== '0' && ticket.deployPlayer === playerId,
    ),
    (p) => 2 * (p.component.forEach?.length ?? 1),
  ) +
  sum(
    levelProgress.tickets.filter(
      (ticket) =>
        ticket.component.id !== '0' && ticket.commitPlayer === playerId,
    ),
    (p) => p.component.codeLines.length,
  ) -
  levelProgress.bugs[playerId] +
  (levelProgress.finished === 'won' ? level.totalTime - time : 0)

export const initialLevelProgress = (level: Level): LevelState => ({
  tickets: [
    ...getNextComponents(level.rootComponent, []).map<Ticket>((component) => ({
      component,
      progress: component.id === '0' ? 'deployed' : 'specified',
      codingProgress: { current: 0, errors: [], indents: [0] },
    })),
  ],
  activeWorkspaces: ['code-editor', 'api'],
  bugs: [0, 0, 0, 0],
})

export const getNextComponents = (component: Component, _tickets: Ticket[]) => [
  ...findNodes(component, (_c) => true),
]
