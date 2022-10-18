import { Component } from './level'

export type LevelProgress = {
  componentsProgress: ComponentProgress[]
  codingProgress: CodingProgress
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
