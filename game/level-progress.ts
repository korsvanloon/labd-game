import { sum } from '../util/math'
import { findNodes } from '../util/tree'
import { Component, Level } from './level'

export type ActiveWorkspace = 'code-editor' | 'api'

export type LevelState = {
  tickets: Ticket[]
  bugs: number
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
  workspace?: number
}

export type CodingProgress = {
  errors: boolean[]
  current: number
  indents: number[]
}

export const calculateScore = (
  level: Level,
  levelProgress: LevelState,
  time: number,
) =>
  sum(
    levelProgress.tickets.filter(
      (ticket) => ticket.progress === 'deployed' && ticket.component.id !== '0',
    ),
    (p) => p.component.codeLines.length * (p.component.forEach?.length ?? 1),
  ) -
  levelProgress.bugs +
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
  bugs: 0,
})

export const getNextComponents = (component: Component, _tickets: Ticket[]) => [
  ...findNodes(component, (_c) => true),
]
