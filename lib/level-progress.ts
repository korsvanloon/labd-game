import { Component, Level } from './level'

export type LevelProgress = {
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

export const initialLevelProgress = (level: Level): LevelProgress => ({
  componentsProgress: level.allComponents.map((component, i) => ({
    component,
    progress: i === 0 ? 'deployed' : 'specified',
  })),
  codingProgress: { current: 0, indents: [0], errors: [] },
  bugs: 0,
})
