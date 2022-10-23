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
        state.codingProgress.indents = ticket.component.codeLines.map(
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
        commit(state, ticket)
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
        const dropZone = findDropZone(ticket.component)
        deploy(state, level, ticket, dropZone)
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
            p.progress === 'coding',
        )
        .slice(0, amount)

      tickets.forEach((ticket) => {
        const dropZone = findDropZone(ticket.component)
        deploy(state, level, ticket, dropZone)
      })
      console.info(tickets.slice(-1)[0])
      return { ...state }
    }),
})

const findDropZone = (component: Component) =>
  document.querySelector<HTMLElement>(`[data-component-id='${component.id}']`)!
