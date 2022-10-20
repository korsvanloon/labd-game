import { Component, Level } from './level'
import { sum } from './math'
import { findNodes } from './tree'

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

export const calculateScore = (levelProgress: LevelProgress) =>
  sum(
    levelProgress.componentsProgress.filter((f) => f.progress === 'deployed'),
    (p) => p.component.structure.length,
  ) - levelProgress.bugs

export const initialLevelProgress = (level: Level): LevelProgress => ({
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
