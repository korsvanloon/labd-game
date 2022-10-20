export function* findNodes<T extends { children?: T[] }>(
  component: T,
  predicate: (i: T) => boolean,
): Iterable<T> {
  if (component.children) {
    for (const child of component.children) {
      yield* findNodes(child, predicate)
    }
  }
  if (predicate(component)) {
    yield component
  }
}
