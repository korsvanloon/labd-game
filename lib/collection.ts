/**
 * Divides an array in an `amount` of sub-arrays.
 *
 * @example
 * ```ts
 * divideInChunks([1,2,3,4,5,6], 2)
 *
 * // results in
 * [[1,2,3], [4,5,6]]
 * ```
 */
export function divideInChunks<T>(items: T[], amount: number): T[][] {
  const result: T[][] = []
  const chunkSize = Math.ceil(items.length / amount)

  for (let i = 0; i < amount; i++) {
    result.push(items.slice(chunkSize * i, chunkSize * (i + 1)))
  }

  return result
}

/**
 * Groups a list based on a callback.
 * Returns a Map where the keys are the result of the callback.
 *
 * @example
 * ```ts
 * groupByMap(
 *   [{age: 18, name: 'John'}, {age: 18, name: 'Joe'}, {age: 16, name: 'Jack'}],
 *   p => p.age,
 * )
 *
 * // results in
 * Map {
 *  16: [{age: 16, name: 'Jack'}],
 *  18: [{age: 18, name: 'John'}, {age: 18, name: 'Joe'}],
 * }
 * ```
 */
export const groupByMap = <T, S>(list: T[], keyGetter: (i: T) => S) => {
  const map = new Map<S, T[]>()
  list.forEach((item) => {
    const key = keyGetter(item)
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [item])
    } else {
      collection.push(item)
    }
  })
  return map
}

/**
 * Groups a list based on a callback.
 * Returns a Map where the keys are the result of the callback.
 *
 * @example
 * ```ts
 * groupBy(
 *   [{age: 18, name: 'John'}, {age: 18, name: 'Joe'}, {age: 16, name: 'Jack'}],
 *   p => p.age,
 * )
 *
 * // results in
 * [
 *  [16, [{age: 16, name: 'Jack'}]],
 *  [18, [{age: 18, name: 'John'}, {age: 18, name: 'Joe'}]],
 * ]
 * ```
 */
export const groupBy = <T, S>(list: T[], keyGetter: (i: T) => S) => [
  ...groupByMap(list, keyGetter).entries(),
]

/**
 * Utility to filter out double items in an array by some measure.
 *
 * @example
 * ```ts
 * const products = [
 * {id: 'a', price: 1},
 * {id: 'a', price: 1},
 * {id: 'b', price: 1}
 * ]
 * products.filter(uniqueBy(p => p.id))
 *
 * // results in
 * [{id: 'a', price: 1}, {id: 'b', price: 1}]
 * ```
 */
export const uniqueBy =
  <T, S>(getValue: (item: T) => S) =>
  (v: T, i: number, s: T[]) =>
    s.findIndex((e) => getValue(e) === getValue(v)) === i

/**
 * Shallow compare two objects for a subset of keys.
 *
 * @example
 * ```ts
 * hasDifferentValues(['a'], {a: 1, b: 2}, {a: 1, b: 'different but ignored'})
 *
 * // results in
 * false
 * ```
 */
export const hasDifferentValues = <T extends Record<string, unknown>>(
  keys: (keyof T)[],
  a: T,
  b: T,
) => keys.some((k) => a[k] !== b[k])

/**
 * Utility for lists to ensure there are no empty values.
 *
 * @example
 * ```ts
 * const products = [
 * {id: 'a', price: {centAmount: 20}},
 * {id: 'b', price: null},
 * {id: 'c', price: {centAmount: 30}}
 * ]
 * products.map(x => price).filter(isValue).map(p => p.centAmount)
 *
 * // results in
 * [20, 30]
 * ```
 */
export const isValue = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined

/**
 * Generates an ascending numerical array of size `length`, starting at `start`.
 *
 * @example
 * ```ts
 * range({start: 1, end: 3})
 *
 * // results in
 * [1,2,3]
 * ```
 */
export const range = ({
  start = 0,
  end,
  step = 1,
}: {
  start?: number
  end: number
  step?: number
}) => Array.from({ length: (end - start) / step }, (_, i) => start + i * step)

/**
 * Shuffles the items of an array in a random order.
 */
export const shuffle = <T>(array: T[]) => {
  let currentIndex = array.length

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ]
  }

  return array
}
