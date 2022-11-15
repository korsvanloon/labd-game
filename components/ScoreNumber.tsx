import clsx from 'clsx'
import { HTMLAttributes } from 'react'

export type Styles = {
  scoreNumber: {
    panel: string | undefined
    root?: string
    change?: string
  }
}

type Props = {
  children?: React.ReactNode
  changed: boolean
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export const ScoreNumber = ({
  changed,
  children,
  styles,
  ...attributes
}: Props) => {
  return (
    <em
      {...attributes}
      className={clsx(
        styles.scoreNumber.root,
        changed && styles.scoreNumber.change,
        attributes.className,
      )}
    >
      {children}
    </em>
  )
}
