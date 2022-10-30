import { paramCase } from 'change-case'
import clsx from 'clsx'
import { HTMLAttributes } from 'react'
import { Level } from '../game/level'

export type Styles = {
  apis: {
    root?: string
    api?: string
  }
}

type Props = {
  level: Level
  styles: Styles
} & HTMLAttributes<HTMLDivElement>

export const Apis = ({ level, styles, ...attributes }: Props) => (
  <div {...attributes} className={clsx(styles.apis.root)}>
    <header>APIs</header>
    <div>
      {level.apis?.map((api) => (
        <div key={api.name} className={clsx(styles.apis.api)}>
          <header>
            <strong>{api.name}</strong> {api.type}
          </header>
          <div>
            {api.contentTypes.map((type) => (
              <div
                key={type.name}
                data-action-zone="api"
                data-api={api.name}
                data-type={type.name}
              >
                {paramCase(type.name)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)
