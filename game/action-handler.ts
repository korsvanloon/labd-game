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
import { LevelState } from './level-progress'

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
            return { ...state }
          })
        }
      }
    }
    for (const zone of actionZones) {
      switch (zone.type) {
        case 'api': {
          handleApiAction(event, zone, updateLevelState, controller)
          break
        }
        case 'code-editor': {
          switch (event.soloValue) {
            case 'up': {
              updateLevelState((state) => {
                const { current } = state.codingProgress
                state.codingProgress.current = Math.max(0, current - 1)
                return { ...state }
              })
              break
            }
            case 'down': {
              updateLevelState((state) => {
                const ticket = state.tickets.find(
                  (c) => c.progress === 'coding',
                )
                if (!ticket) return state

                const { current, indents } = state.codingProgress

                if (
                  // current is at last coded line
                  current === indents.length - 1 &&
                  // but there is more to code
                  indents.length < ticket.component.codeLines.length
                ) {
                  addLine(state)
                }
                state.codingProgress.current = Math.min(
                  current + 1,
                  ticket.component.codeLines.length - 1,
                )
                return { ...state }
              })
              break
            }
            case 'left': {
              updateLevelState((state) => {
                changeIndent(state, -1)
                return { ...state }
              })
              break
            }
            case 'right': {
              updateLevelState((state) => {
                const ticket = getPlayerTicket(state, controller.id)
                if (ticket?.progress === 'specified') {
                  const existing = state.tickets.find(
                    (t) => t.progress === 'coding',
                  )
                  if (existing) {
                    existing.progress = 'specified'
                  }
                  ticket.progress = 'coding'
                  ticket.player = undefined
                  state.codingProgress = {
                    current: 0,
                    errors: [],
                    indents: [0],
                  }
                  return { ...state }
                } else {
                  const { current, indents } = state.codingProgress
                  if (current > 0 && indents[current] <= indents[current - 1]) {
                    changeIndent(state, +1)
                    return { ...state }
                  }
                }

                return state
              })
            }
          }
          break
        }
        case 'commit-button': {
          switch (event.soloValue) {
            case 'right': {
              updateLevelState((state) => {
                const ticket = state.tickets.find(
                  (c) => c.progress === 'coding',
                )
                if (
                  !ticket ||
                  state.codingProgress.indents.length !==
                    ticket.component.codeLines.length
                )
                  return state

                const { isValid, errors } = ticketValidation(state, ticket)

                if (isValid) {
                  commit(state, ticket)
                } else if (!arrayEquals(state.codingProgress.errors, errors)) {
                  controller.buzz()
                  state.codingProgress.errors = errors
                  state.bugs += errors.filter(Boolean).length
                }
                return { ...state }
              })
              // return is event.preventDefault()
              return
            }
          }
          break
        }
        case 'component-slot': {
          switch (event.soloValue) {
            case 'right': {
              if (!event.changed) return

              updateLevelState((state) => {
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
                return { ...state }
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
              updateLevelState((state) => {
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
                return { ...state }
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

              updateLevelState((state) => {
                const ticket = getPlayerTicket(state, controller.id)
                if (ticket) {
                  ticket.player = undefined
                }
                return { ...state }
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
      updateLevelState((state) => {
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
        return { ...state }
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
