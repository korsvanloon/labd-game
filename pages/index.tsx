import { capitalCase } from 'change-case'
import fs from 'fs'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import path from 'path'
import styles from './index.module.css'

type Props = {
  levels: string[]
}

export default function Web({ levels }: Props) {
  return (
    <div className={styles.Index}>
      <h1>Lab Digital - The Game</h1>

      <div className={styles.body}>
        <ol className={styles.linkList}>
          {levels.map((level) => (
            <li key={level}>
              <Link href={`/level/${level}`}>
                {capitalCase(level.replace(/^\d{2}-/, ''))}
              </Link>
            </li>
          ))}
        </ol>

        <div className={styles.controls}>
          <h2>Controls</h2>
          <dl>
            <dt>Minus/Plus</dt>
            <dd>Switch Avatar</dd>
            <dt>Joystick</dt>
            <dd>Move around</dd>
            <dt>Left</dt>
            <dd>Cancel/Drop, scroll left, indent code left</dd>
            <dt>Up</dt>
            <dd>scroll up</dd>
            <dt>Right</dt>
            <dd>Confirm/Pick up, scroll right, indent code right</dd>
            <dt>Down</dt>
            <dd>scroll down</dd>
          </dl>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({}) => {
  const levels = fs
    .readdirSync('./data/levels')
    .map((name) => name.replace(path.extname(name), ''))

  return {
    props: {
      levels,
    },
  }
}
