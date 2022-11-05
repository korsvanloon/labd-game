'use client'
import clsx from 'clsx'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Controller } from '../controller/interface'
import { accelerationDebounced } from '../controller/joy-con/events'

export type Styles = {
  dialogSelect: {
    root?: string
    selected?: string
    option?: string
  }
}

type Props<T> = {
  current?: T
  options: T[]
  getOptionValue: (o: T) => string
  buildOptionNode: (o: T, selected: boolean) => React.ReactNode
  controller: Controller
  open?: boolean
  onSubmit: (profile: T) => void
  styles: Styles
}

export function DialogSelect<T>({
  current,
  options,
  getOptionValue,
  buildOptionNode: getOptionNode,
  controller,
  open,
  onSubmit,
  styles,
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
        if (selected) {
          ref.current
            ?.querySelector(`input[value="${getOptionValue(selected)}"]`)
            ?.scrollIntoView({ block: 'center' })
        }
      }

      controller.onMove = ({ direction, sameDirectionCount }) => {
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
      if (selected) {
        onSubmit(selected)
      }
    }

    ref.current.addEventListener('close', handleClose)

    return () => ref.current?.removeEventListener('close', handleClose)
  }, [ref, selected])

  return (
    <dialog
      {...attributes}
      ref={ref}
      className={clsx(styles.dialogSelect.root, attributes.className)}
      style={{ marginLeft: `${controller.id * 25 + 5}%`, ...attributes.style }}
    >
      <form method="dialog">
        {options.map((option, i) => (
          <label
            key={i}
            className={clsx(
              styles.dialogSelect.option,
              option === selected && styles.dialogSelect.selected,
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
