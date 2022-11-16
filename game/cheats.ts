import { isValue } from '../util/collection'
import { commit, deploy } from './actions'
import { Component, Level } from './level'
import { LevelState } from './level-progress'

export const cheats = (
  setLevelState: (setter: (state: LevelState) => LevelState) => void,
  level: Level,
) => ({
  finishCoding: (type?: string) =>
    setLevelState((state) => {
      const tickets = state.tickets
        .filter((p) =>
          type ? p.component.type === type : p.progress === 'coding',
        )
        .slice(0, 1)

      tickets.forEach((ticket) => {
        ticket.progress = 'coding'
        ticket.codingProgress.indents = ticket.component.codeLines.map(
          (c) => c.indent,
        )
      })
      console.info(tickets.slice(-1)[0])
      return { ...state }
    }),
  commit: (amount: number = 1) =>
    setLevelState((state) => {
      const tickets = state.tickets
        .filter((p) => p.progress === 'coding' || p.progress === 'specified')
        .slice(0, amount)
        .sort((a, b) => a.progress.localeCompare(b.progress))

      tickets.forEach((ticket) => {
        commit(state, ticket, 0)
      })
      console.info(tickets.slice(-1)[0])
      return { ...state }
    }),
  deploy: (amount: number = 1) =>
    setLevelState((state) => {
      const tickets = state.tickets
        .filter((p) => p.progress === 'ready')
        .slice(0, amount)

      tickets.forEach((ticket) => {
        findDropZones(ticket.component).forEach((dropZone) =>
          deploy(ticket, dropZone, 0),
        )
      })
      console.info(tickets.slice(-1)[0])
      return { ...state }
    }),
  skip: (amount: number = 1) =>
    setLevelState((state) => {
      const tickets = state.tickets
        .filter(
          (p) =>
            p.progress === 'specified' ||
            p.progress === 'coded' ||
            p.progress === 'api-progress' ||
            p.progress === 'coding',
        )
        .slice(0, amount)

      tickets.forEach((ticket) => {
        findDropZones(ticket.component).forEach((dropZone) =>
          deploy(ticket, dropZone, 0),
        )
      })
      console.info(tickets.slice(-1)[0])
      return { ...state }
    }),
})

const findDropZones = (component: Component) =>
  [component.id, ...(component.forEach?.ids ?? [])]
    .map((id) =>
      document.querySelector<HTMLElement>(`[data-component-id='${id}']`),
    )
    .filter(isValue)
