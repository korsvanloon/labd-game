import apis from 'styles/Apis.module.css'
import appBar from 'styles/AppBar.module.css'
import browser from 'styles/Browser.module.css'
import codeEditor from 'styles/CodeEditor.module.css'
import dialogSelect from 'styles/DialogSelect.module.css'
import level from 'styles/Level.module.css'
import player from 'styles/Player.module.css'
import scoreNumber from 'styles/ScoreNumber.module.css'
import sprint from 'styles/Sprint.module.css'
import ticket from 'styles/Ticket.module.css'
import LevelView, { Styles as LevelStyles } from '../../../components/Level'
import { createLevel, readLevelFile, readLevelHtml } from '../../../game/level'

const styles = {
  appBar,
  apis,
  browser,
  codeEditor,
  dialogSelect,
  player,
  scoreNumber,
  ticket,
  sprint,
  level,
} as unknown as LevelStyles

type Props = {
  params: {
    level: string
  }
}

export default async function Page({ params: { level: levelName } }: Props) {
  const levelFile = readLevelFile(levelName)

  const htmlString = readLevelHtml(levelFile.slug)

  const level = createLevel(htmlString, levelFile)

  return <LevelView level={level} styles={styles} />
}
