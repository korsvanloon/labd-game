import clsx from 'clsx'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { accelerationDebounced } from '../joy-con/events'
import { JoyCon } from '../joy-con/joycon'
import styles from './DialogSelect.module.css'

type Props<T> = {
  current: T
  options: T[]
  getOptionValue: (o: T) => string
  getOptionNode: (o: T, selected: boolean) => React.ReactNode
  controller: JoyCon
  open?: boolean
  onSubmit: (profile: T) => void
}

export function DialogSelect<T>({
  current,
  options,
  getOptionValue,
  getOptionNode,
  controller,
  open,
  onSubmit,
  ...attributes
}: Props<T> & Omit<React.HTMLAttributes<HTMLDialogElement>, 'onSubmit'>) {
  const ref = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState(current)

  const select = useCallback(
    (offset: number) => {
      const index = options.findIndex((x) => x === selected)
      const newSelected =
        options[(options.length + index + offset) % options.length]
      setSelected(newSelected)
      ref.current
        ?.querySelector(`input[value="${getOptionValue(newSelected)}"]`)
        ?.scrollIntoView({ block: 'center' })
    },
    [selected],
  )

  useEffect(() => {
    if (!ref.current) return

    if (open) {
      if (!ref.current.open) {
        ref.current.showModal()
        ref.current
          ?.querySelector(`input[value="${getOptionValue(selected)}"]`)
          ?.scrollIntoView({ block: 'center' })
      }

      controller.onJoystick = ({ direction, sameDirectionCount }) => {
        if (accelerationDebounced(sameDirectionCount)) return

        switch (direction) {
          case 'down': {
            select(1)
            break
          }
          case 'up': {
            select(-1)
            break
          }
        }
      }

      controller.onButton = ({ soloValue, sameButtonCount, changed }) => {
        if (accelerationDebounced(sameButtonCount)) return

        switch (soloValue) {
          case 'down': {
            select(1)
            break
          }
          case 'up': {
            select(-1)
            break
          }
          case 'right': {
            ref.current?.close()
            break
          }
          case 'special': {
            if (!changed) return
            setSelected(current)
            ref.current?.close()
            break
          }
        }
      }
    } else {
      ref.current.close()
    }
  }, [open, ref, selected])

  useEffect(() => {
    if (!ref.current) return

    const handleClose = (_event: Event) => {
      onSubmit(selected)
    }

    ref.current.addEventListener('close', handleClose)

    return () => ref.current?.removeEventListener('close', handleClose)
  }, [ref, selected])

  return (
    <dialog
      {...attributes}
      ref={ref}
      className={clsx(styles.dialog, attributes.className)}
      style={{ marginLeft: `${controller.id * 25 + 5}%`, ...attributes.style }}
    >
      <form method="dialog">
        {options.map((option, i) => (
          <label
            key={i}
            className={clsx(
              styles.option,
              option === selected && styles.selected,
            )}
          >
            <input
              type="radio"
              name="profile"
              value={getOptionValue(option)}
              checked={option === selected}
              onChange={() => setSelected(option)}
            />
            <div>{getOptionNode(option, option === selected)}</div>
          </label>
        ))}
        <button type="submit">submit</button>
      </form>
    </dialog>
  )
}
