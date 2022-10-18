import { Component, Level } from './level'

export type LevelProgress = {
  componentsProgress: ComponentProgress[]
  codingProgress: CodingProgress
  mistakes: number
}

export type ComponentProgress = {
  component: Component
  progress: 'ticket' | 'coded' | 'grabbed' | 'deployed'
}

export type CodingProgress = {
  errors: boolean[]
  current: number
  indents: number[]
}

export const initialLevelProgress = (level: Level): LevelProgress => ({
  componentsProgress: level.allComponents.map((component, i) => ({
    component,
    progress: i === 0 ? 'deployed' : 'ticket',
  })),
  codingProgress: { current: 0, indents: [0], errors: [] },
  mistakes: 0,
})
