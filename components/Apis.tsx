import { paramCase } from 'change-case'
import clsx from 'clsx'
import { HTMLAttributes } from 'react'
import { Level } from '../game/level'
import styles from './Apis.module.css'

type Props = {
  level: Level
} & HTMLAttributes<HTMLDivElement>

export const Apis = ({ level, ...attributes }: Props) => (
  <div {...attributes} className={clsx(styles.Apis)}>
    <header>APIs</header>
    <div>
      {level.apis?.map((api) => (
        <div key={api.name} className={clsx(styles.api)}>
          <header>
            <strong>{api.name}</strong> {api.type}
          </header>
          <div>
            {api.contentTypes.map((type) => (
              <div
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
