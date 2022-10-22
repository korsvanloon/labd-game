import fs from 'fs'
import domParser from 'node-html-parser'
import {
  codeLinesToString,
  createLevel,
  enhanceComponent,
  readLevelFile,
} from '../../game/level'

const levelFile = readLevelFile('agradi-homepage')
const pageHtmlString = fs.readFileSync(
  './data/sites/agradi-homepage.html',
  'utf-8',
)
const dom = domParser.parse(pageHtmlString, {})

it('should enhance component', () => {
  const component = levelFile.rootComponent.children![0]
  const componentDom = dom.querySelector(component.selector)!
  enhanceComponent(component, componentDom, '0')

  expect(component.id).toBe('0')

  const result = codeLinesToString(component.codeLines)

  expect(result).toEqual(
    `section.section.topbar.desktop
  div.container
    div.d-flex
      div.usps.flex-fill.px-0
        div.row.font-weight-bold
          for-each headerUsps
            { headerUsp }
      div.links.right.px-0
        a.link.topbar
          "Klantenservice"
        { countrySwitch }`,
  )
})

it('should parse structure correctly', () => {
  const level = createLevel(pageHtmlString, levelFile)
  const result = codeLinesToString(level.rootComponent.children![0].codeLines)
})
