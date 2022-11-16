import fs from 'fs'
import path from 'path'
import { LevelOverview } from '../../components/LevelOverview'
import levelOverviewStyles from '../../styles/LevelOverview.module.css'

export default async function Page() {
  const levels = fs
    .readdirSync('./data/levels')
    .filter((n) => !n.startsWith('_'))
    .map((name) => name.replace(path.extname(name), ''))

  return (
    <LevelOverview
      links={levels}
      styles={{ levelOverview: levelOverviewStyles }}
    />
  )
}
