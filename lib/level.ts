import { readFileSync } from 'fs'
import domParser, { HTMLElement } from 'node-html-parser'
import { parse } from 'yaml'

export type LevelProgress = {
  componentsDone: { [id: string]: string }
}

export interface Level {
  url: string
  fonts: string[]
  styles: string[]
  rootComponent: Component
  allComponents: Component[]
}

export interface Component {
  id: string
  type: string
  selector: string
  html: string
  children?: Component[]
  copyContent?: CopyContent[]
  structure: string
}

export type CopyContent = {
  selector: string
}

export const readLevelFile = async (name: string) => {
  const file = readFileSync(`./data/levels/${name}.yaml`, 'utf-8')

  const level = parse(file) as Level

  const htmlString = await fetch(level.url).then((r) => r.text())
  const dom = domParser.parse(htmlString, {})

  enhanceComponent(level.rootComponent, dom, level, '0')

  level.allComponents = [...getAllComponents(level.rootComponent)]

  return level
}

function* getAllComponents(component: Component): Iterable<Component> {
  yield component
  if (!component.children) return

  for (const child of component.children) {
    yield* getAllComponents(child)
  }
}

const enhanceComponent = (
  component: Component,
  dom: HTMLElement,
  level: Level,
  id: string,
) => {
  const componentDom = dom.querySelector(component.selector)
  if (!componentDom) {
    throw new Error(`Could not find ${component.selector}`)
  }
  component.id = id
  componentDom?.setAttribute('component-id', id)

  component.children?.forEach((child, i) => {
    enhanceComponent(child, componentDom, level, `${id}.${i}`)
    const childDom = componentDom.querySelector(child.selector)
    childDom?.classList.add('drop-zone')
  })

  component.structure = componentDom.structure
  component.html = getSanitizedHtml(componentDom)
}

export const getSanitizedHtml = (dom: HTMLElement) =>
  dom?.outerHTML
    .replace(/<(a|button|input|select) /g, '<span ')
    .replace(/<\/(a|button|input|select)>/g, '</span>')
    .replace(/<noscript>/g, '')
    .replace(/<\/noscript>/g, '')
