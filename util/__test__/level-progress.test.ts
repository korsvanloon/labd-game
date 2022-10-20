import fs from 'fs'
import { createLevel, readLevelFile } from '../../game/level'
import { getNextComponents } from '../../game/level-progress'

const levelFile = readLevelFile('agradi-homepage')
const htmlString = fs.readFileSync('./data/sites/agradi-homepage.html', 'utf-8')
const level = createLevel(htmlString, levelFile)

it('should get valid next component', () => {
  const result = getNextComponents(level.rootComponent, [
    { component: level.rootComponent, progress: 'deployed' },
  ])
  expect(result[0].id).toBe('0.0')
})
