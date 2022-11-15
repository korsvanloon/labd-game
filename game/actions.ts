import { clamp } from '../util/math'
import { randomSeed } from '../util/random'
import { Level } from './level'
import { LevelState, Ticket } from './level-progress'

const seed = 2
const random = randomSeed(seed)

export function changeIndent(ticket: Ticket, change: number) {
  const { indents, errors, current } = ticket.codingProgress
  if (ticket && current < ticket?.component.codeLines.length) {
    indents[current] = clamp(indents[current] + change, 0, 10)
    errors[current] = false
  }
}

export function addLine(ticket: Ticket) {
  const { indents } = ticket.codingProgress
  indents.push(indents[indents.length - 1])
}

export function deploy(
  _state: LevelState,
  _level: Level,
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
  }
}

export const ticketValidation = (ticket: Ticket) => {
  const errors = ticket.component.codeLines.map(
    ({ indent }, i) => indent !== ticket.codingProgress.indents[i],
  )
  const isValid = errors.every((error) => !error)
  return { isValid, errors }
}

export function commit(state: LevelState, ticket: Ticket) {
  const progress: Ticket['progress'] = ticket.component.forEach?.api
    ? 'coded'
    : 'ready'

  ticket.progress = progress
  ticket.workspace = undefined
  ticket.player = undefined

  state.tickets
    .filter(
      (p) =>
        p.component.type === ticket.component.type &&
        p.progress === 'specified',
    )
    .forEach((p) => (p.progress = progress))
}
