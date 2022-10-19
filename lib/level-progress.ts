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
  ...findComponents(
    component,
    (c) =>
      componentsProgress.some(
        (p) => p.progress === 'deployed' && p.component.children?.includes(c),
      ) && !componentsProgress.some((p) => p.component === c),
  ),
]

export function* findComponents(
  component: Component,
  predicate: (i: Component) => boolean,
): Iterable<Component> {
  if (component.children) {
    for (const child of component.children) {
      yield* findComponents(child, predicate)
    }
  }
  if (predicate(component)) {
    yield component
  }
}
