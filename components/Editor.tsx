import clsx from 'clsx'
import { HTMLAttributes, useEffect, useState } from 'react'
import { JoyCon } from '../joy-con/joycon'
import { Component } from '../lib/level'
import styles from './Editor.module.css'

type Props = {
  controller?: JoyCon
  ticket?: Component
  // onComponent: (component: Component) => void
} & HTMLAttributes<HTMLDivElement>
type State = {
  current: number
  indents: number[]
}

const cleanClasses = (value: string) => {
  return value.replace(/[\w-]+--/g, '')
  // return value
}
export const Editor = ({ controller, ticket, ...attributes }: Props) => {
  const [state, setState] = useState<State>({ current: 0, indents: [0] })
  const lines = ticket?.structure.split('\n').map((x) => cleanClasses(x)) ?? []

  useEffect(() => {
    if (controller) {
      controller.onButton = ({ changed, soloValue }) => {
        if (!changed) return
        switch (soloValue) {
          case 'left': {
            setState((state) => {
              state.indents[state.current] = Math.max(
                0,
                state.indents[state.current] - 1,
              )
              return { ...state }
            })
            break
          }
          case 'right': {
            setState((state) => {
              state.indents[state.current] = Math.min(
                lines.length - 1,
                state.indents[state.current] + 1,
              )
              return { ...state }
            })
            break
          }
          case 'up': {
            setState((state) => ({
              ...state,
              current: Math.max(0, state.current - 1),
            }))
            break
          }
          case 'down': {
            setState((state) => ({
              indents: [
                ...state.indents,
                state.indents[state.indents.length - 1],
              ],
              current: Math.max(0, state.current + 1),
            }))
            break
          }
        }
      }
    }
  }, [controller])
  return (
    <div {...attributes} className={clsx(styles.Editor)}>
      <div className={styles.header}>{ticket?.type}</div>
      <pre className="scrollable">
        {lines.slice(0, state.indents.length + 1).map((line, i) => (
          <code
            key={line}
            className={clsx(state.current === i) && styles.selected}
          >
            {line.trim()}
          </code>
        ))}
      </pre>
    </div>
  )
}
