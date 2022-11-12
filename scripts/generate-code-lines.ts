import { readdirSync, writeFileSync } from 'fs'
import path from 'path'
import yaml from 'yaml'
import {
  codeLinesToString,
  createLevel,
  readLevelFile,
  readLevelHtml,
} from '../game/level'
import { findNodes } from '../util/tree'

async function main() {
  const levels = readdirSync('./data/levels').map((name) =>
    name.replace(path.extname(name), ''),
  )

  for (const levelName of levels) {
    const levelFile = readLevelFile(levelName)

    const htmlString = readLevelHtml(levelFile.slug)

    const level = createLevel(htmlString, levelFile)

    const data = yaml.stringify(
      [...findNodes(level.rootComponent, () => true)]
        .filter((c) => c !== level.rootComponent)
        .map((c) => ({
          type: c.type,
          code: codeLinesToString(c.codeLines),
        })),
    )
    writeFileSync(`./out/${levelName}.yaml`, data)
  }
}

main()
