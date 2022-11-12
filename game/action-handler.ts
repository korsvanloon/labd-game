import { ActionZone } from '../components/Player'
import { ButtonEvent, Controller } from '../controller/interface'
import { arrayEquals, isValue } from '../util/collection'
import {
  addLine,
  changeIndent,
  commit,
  deploy,
  ticketValidation,
} from './actions'
import { Level } from './level'
import { ActiveWorkspace, LevelState } from './level-progress'

const scrollStep = 200

export type UpdateLevelState = (
  setter: (state: LevelState) => LevelState,
) => void

export const handleAction = (
  updateLevelState: UpdateLevelState,
  level: Level,
  controller: Controller,
) =>
  function (event: ButtonEvent, actionZones: ActionZone[]) {
    if (!actionZones.length) {
      switch (event.soloValue) {
        case 'left': {
          if (!event.changed) return
          updateLevelState((state) => {
            const ticket = getPlayerTicket(state, controller.id)
            if (ticket) {
              ticket.player = undefined
            }
            return state
          })
        }
      }
    }
    for (const zone of actionZones) {
      switch (zone.type) {
        case 'set-workspace': {
          const workspace = Number(zone.element.dataset.id)
          const work = zone.element.dataset.work as ActiveWorkspace

          updateLevelState((s) => {
            const state = structuredClone(s)
            state.activeWorkspaces[workspace] = work
            return state
          })
          break
        }
        case 'api': {
          handleApiAction(event, zone, updateLevelState, controller)
          break
        }
        case 'code-editor': {
          const workspace = Number(zone.element.dataset.id)

          switch (event.soloValue) {
            case 'up': {
              updateLevelState((s) => {
                const state = structuredClone(s)
                const ticket = state.tickets.find(
                  (c) => c.progress === 'coding' && c.workspace === workspace,
                )
                if (!ticket) return state
                ticket.codingProgress.current = Math.max(
                  0,
                  ticket.codingProgress.current - 1,
                )
                return state
              })
              break
            }
            case 'down': {
              updateLevelState((s) => {
                const state = structuredClone(s)
                const ticket = state.tickets.find(
                  (c) => c.progress === 'coding' && c.workspace === workspace,
                )
                if (!ticket) return state

                const { current, indents } = ticket.codingProgress

                if (
                  // current is at last coded line
                  current === indents.length - 1 &&
                  // but there is more to code
                  indents.length < ticket.component.codeLines.length
                ) {
                  addLine(ticket)
                }
                ticket.codingProgress.current = Math.min(
                  current + 1,
                  ticket.component.codeLines.length - 1,
                )
                return state
              })
              break
            }
            case 'left': {
              updateLevelState((s) => {
                const state = structuredClone(s)
                const ticket = state.tickets.find(
                  (c) => c.progress === 'coding' && c.workspace === workspace,
                )
                if (!ticket) {
                  return state
                }
                changeIndent(ticket, -1)
                return state
              })
              break
            }
            case 'right': {
              updateLevelState((s) => {
                const state = structuredClone(s)
                const ticket = state.tickets.find(
                  (c) => c.progress === 'coding' && c.workspace === workspace,
                )
                const playerTicket = getPlayerTicket(state, controller.id)
                if (playerTicket?.progress === 'specified') {
                  if (ticket) {
                    ticket.progress = 'specified'
                    ticket.workspace = undefined
                  }
                  playerTicket.progress = 'coding'
                  playerTicket.player = undefined
                  playerTicket.workspace = workspace
                  playerTicket.codingProgress = {
                    current: 0,
                    errors: [],
                    indents: [0],
                  }
                  return state
                } else if (ticket) {
                  const { current, indents } = ticket.codingProgress
                  if (current > 0 && indents[current] <= indents[current - 1]) {
                    changeIndent(ticket, +1)
                    return state
                  }
                }

                return state
              })
              break
            }
          }
          break
        }
        case 'commit-button': {
          const workspace = Number(zone.element.dataset.id)

          switch (event.soloValue) {
            case 'right': {
              updateLevelState((s) => {
                const state = structuredClone(s)
                const ticket = state.tickets.find(
                  (c) => c.progress === 'coding' && c.workspace === workspace,
                )
                if (
                  !ticket ||
                  ticket.codingProgress.indents.length !==
                    ticket.component.codeLines.length
                )
                  return state

                const { isValid, errors } = ticketValidation(ticket)

                if (isValid) {
                  commit(state, ticket)
                } else if (!arrayEquals(ticket.codingProgress.errors, errors)) {
                  controller.buzz()
                  ticket.codingProgress.errors = errors
                  state.bugs += errors.filter(Boolean).length
                }
                return state
              })
              return
            }
          }
          break
        }
        case 'component-slot': {
          switch (event.soloValue) {
            case 'right': {
              if (!event.changed) return

              updateLevelState((s) => {
                const state = structuredClone(s)
                const slotComponentId = zone.element.dataset.componentId
                const ticket = getPlayerTicket(state, controller.id)

                if (!ticket) return state

                const isValid =
                  ticket.progress === 'ready' &&
                  slotComponentId &&
                  (ticket.component.forEach?.ids.includes(slotComponentId) ||
                    slotComponentId === ticket.component.id)

                if (isValid) {
                  deploy(state, level, ticket, zone.element)
                } else {
                  state.bugs += Math.ceil(
                    ticket.component.codeLines.length * 0.5,
                  )
                  ticket.player = undefined
                  controller.buzz()
                }
                return state
              })
              break
            }
          }
          break
        }
        case 'horizontal-scroll': {
          switch (event.soloValue) {
            case 'left': {
              if (getComputedStyle(zone.element).overflowX !== 'visible') {
                zone.element.scrollBy({ left: -scrollStep })
              } else {
                zone.element.style.marginLeft = `${Math.min(
                  0,
                  parseInt(zone.element.style.marginLeft || '0') + scrollStep,
                )}px`
              }
              break
            }
            case 'right': {
              if (getComputedStyle(zone.element).overflowX !== 'visible') {
                zone.element.scrollBy({ left: scrollStep })
              } else {
                zone.element.style.marginLeft = `${Math.max(
                  -1200,
                  parseInt(zone.element.style.marginLeft || '0') - scrollStep,
                )}px`
              }
              break
            }
          }
          break
        }
        case 'ticket': {
          switch (event.soloValue) {
            case 'right': {
              updateLevelState((s) => {
                const state = structuredClone(s)
                const existing = getPlayerTicket(state, controller.id)
                if (existing) {
                  existing.player = undefined
                }

                const componentId = zone.element.dataset.componentId
                const ticket = state.tickets.find(
                  (p) => p.component.id === componentId,
                )
                if (ticket) {
                  ticket.player = controller.id
                }
                return state
              })
              break
            }
          }
          break
        }
        case 'vertical-scroll': {
          switch (event.soloValue) {
            case 'up': {
              zone.element.scrollBy({ top: -scrollStep })
              break
            }
            case 'down': {
              zone.element.scrollBy({ top: scrollStep })
              break
            }
          }
          break
        }
        default: {
          switch (event.soloValue) {
            case 'left': {
              if (!event.changed) return

              updateLevelState((s) => {
                const state = structuredClone(s)
                const ticket = getPlayerTicket(state, controller.id)
                if (ticket) {
                  ticket.player = undefined
                }
                return state
              })
              break
            }
          }
        }
      }
    }
  }

const getPlayerTicket = (state: LevelState, id: number) =>
  state.tickets.find((p) => p.player === id)

export function handleApiAction(
  event: ButtonEvent,
  zone: ActionZone,
  updateLevelState: UpdateLevelState,
  controller: Controller,
) {
  switch (event.soloValue) {
    case 'right': {
      updateLevelState((s) => {
        const state = structuredClone(s)
        const api = [zone.element.dataset.api, zone.element.dataset.type]
          .filter(isValue)
          .join('.')
        const ticket = getPlayerTicket(state, controller.id)

        if (!ticket) return state

        if (
          ticket.progress === 'coded' &&
          api &&
          ticket.component.forEach?.api === api
        ) {
          ticket.progress = 'ready'
        } else {
          addBugs(state, 1, controller)
          ticket.player = undefined
        }
        return state
      })
      break
    }
  }
}

export function addBugs(
  state: LevelState,
  bugs: number,
  controller: Controller,
) {
  state.bugs += bugs
  controller.buzz()
}
