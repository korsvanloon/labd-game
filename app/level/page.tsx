import { capitalCase } from 'change-case'
import fs from 'fs'
import Link from 'next/link'
import path from 'path'
import styles from './level-overview.module.css'

export default async function Page() {
  const levels = fs
    .readdirSync('./data/levels')
    .map((name) => name.replace(path.extname(name), ''))

  return (
    <div className={styles.root}>
      <ol className={styles.linkList}>
        {levels.map((level) => (
          <li key={level}>
            <Link href={`/level/${level}`}>
              {capitalCase(level.replace(/^\d{2}-/, ''))}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
