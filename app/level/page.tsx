import fs from 'fs'
import path from 'path'
import { LevelOverview } from '../../components/LevelOverview'
import levelOverviewStyles from '../../styles/LevelOverview.module.css'

export default async function Page() {
  const levels = fs
    .readdirSync('./data/levels')
    .map((name) => name.replace(path.extname(name), ''))

  return (
    <LevelOverview
      levels={levels}
      styles={{ levelOverview: levelOverviewStyles }}
    />
  )
}
