import { shuffle } from '../util/collection'
import { clamp } from '../util/math'
import { randomSeed } from '../util/random'
import { Level } from './level'
import { getNextComponents, LevelState, Ticket } from './level-progress'

const seed = 2
const random = randomSeed(seed)

export function changeIndent(state: LevelState, change: number) {
  const { indents, errors, current } = state.codingProgress
  const ticket = state.tickets.find((t) => t.progress === 'coding')
  if (ticket && current < ticket?.component.codeLines.length) {
    indents[current] = clamp(indents[current] + change, 0, 10)
    errors[current] = false
  }
}

export function addLine(state: LevelState) {
  const { indents } = state.codingProgress
  indents.push(indents[indents.length - 1])
}

export function deploy(
  state: LevelState,
  level: Level,
  ticket: Ticket,
  dropZone: HTMLElement,
) {
  dropZone.removeAttribute('data-action-zone')

  if (ticket.component.forEach) {
    ticket.component.forEach.ids = ticket.component.forEach.ids.filter(
      (id) => id !== dropZone.dataset.componentId,
    )
  }
  if (!ticket.component.forEach?.ids.length) {
    ticket.progress = 'deployed'
    ticket.player = undefined
  } else {
  }

  const queueSize = 4

  const existingSpecified = state.tickets
    .filter((t) => t.progress === 'specified')
    .slice(queueSize)

  state.tickets = [
    ...state.tickets.filter((t) => !existingSpecified.includes(t)),
    // All new items after the queue size get shuffled to create some randomness and replayability.
    ...shuffle(
      [
        ...existingSpecified,
        ...getNextComponents(level.rootComponent, state.tickets).map<Ticket>(
          (component) => ({
            component,
            progress: 'specified',
          }),
        ),
      ],
      random,
    ),
  ]
}

export const ticketValidation = (state: LevelState, ticket: Ticket) => {
  const errors = ticket.component.codeLines.map(
    ({ indent }, i) => indent !== state.codingProgress.indents[i],
  )
  const isValid = errors.every((error) => !error)
  return { isValid, errors }
}

export function commit(state: LevelState, ticket: Ticket) {
  state.codingProgress.indents = [0]
  state.codingProgress.current = 0
  state.codingProgress.errors = []

  const progress: Ticket['progress'] = ticket.component.forEach?.api
    ? 'coded'
    : 'ready'

  ticket.progress = progress
  state.tickets
    .filter(
      (p) =>
        p.component.type === ticket.component.type &&
        p.progress === 'specified',
    )

    .forEach((p) => (p.progress = progress))
}
