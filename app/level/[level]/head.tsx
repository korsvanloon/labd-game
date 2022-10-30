import { existsSync } from 'fs'
import { createLevel, readLevelFile, readLevelHtml } from '../../../game/level'

type Props = {
  params: {
    level: string
  }
}

export default async function Head({ params: { level: levelName } }: Props) {
  const levelFile = readLevelFile(levelName)

  const htmlString = existsSync(`./data/sites/${levelName}.html`)
    ? readLevelHtml(levelName)
    : await fetch(levelFile.url).then((r) => r.text())

  const level = createLevel(htmlString, levelFile)

  return (
    <>
      {level.styles.map((style, i) => (
        // @ts-ignore
        <link precedence="default" key={i} rel="stylesheet" href={style} />
      ))}
    </>
  )
}
