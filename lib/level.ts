import { readFileSync } from 'fs'
import domParser, { HTMLElement } from 'node-html-parser'
import { parse } from 'yaml'
import { isValue } from './collection'

export interface Level {
  url: string
  styles: string[]
  rootComponent: Component
  allComponents: Component[]
}

export interface Component {
  id: string
  type: string
  selector: string
  horizontalScrollSelector?: string
  html: string
  children?: Component[]
  copyContent?: CopyContent[]
  structure: StructureLine[]
}

export type StructureLine = {
  indent: number
  line: string
}

export type CopyContent = {
  selector: string
}

export const readLevelFile = async (name: string) => {
  const file = readFileSync(`./data/levels/${name}.yaml`, 'utf-8')

  const level = parse(file) as Level
  const origin = new URL(level.url).origin

  const htmlString = await fetch(level.url).then((r) => r.text())
  const dom = domParser.parse(htmlString, {})

  level.styles = [
    ...dom
      .querySelectorAll('link[rel=stylesheet]')
      .map((link) => link.getAttribute('href'))
      .map((href) => (href?.startsWith('http') ? href : `${origin}${href}`)),
    ...dom
      .querySelectorAll('style[data-href]')
      .map((link) => link.getAttribute('data-href')),
  ].filter(isValue)

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

  if (component.horizontalScrollSelector) {
    componentDom
      .querySelector(component.horizontalScrollSelector)
      ?.classList.add('horizontal-scrollable')
  }

  component.children?.forEach((child, i) => {
    enhanceComponent(child, componentDom, level, `${id}.${i}`)
    const childDom = componentDom.querySelector(child.selector)
    childDom?.classList.add('drop-zone')
  })

  let lastDropZoneIndent = -1
  component.structure = componentDom.structure
    .split('\n')
    .map((line) => ({
      line: sanitizeClasses(line.trim()),
      indent: line.search(/\S/) / 2,
    }))
    .filter(({ indent, line }) => {
      if (indent < lastDropZoneIndent) {
        lastDropZoneIndent = -1
      }
      if (lastDropZoneIndent === -1 && line.includes('drop-zone')) {
        lastDropZoneIndent = indent
      }
      if (
        lastDropZoneIndent === -1 &&
        (line.startsWith('noscript') || line.startsWith('meta'))
      ) {
        lastDropZoneIndent = indent - 1
      }
      return lastDropZoneIndent === -1 || indent <= lastDropZoneIndent
    })
  component.html = getSanitizedHtml(componentDom)
}
const sanitizeClasses = (value: string) => value.replace(/[\w-]+(--|__)/g, '')

export const getSanitizedHtml = (dom: HTMLElement) => {
  dom.querySelectorAll('input').forEach((d) => d.setAttribute('readonly', ''))
  return dom?.outerHTML
    .replace(/<(a|button|select) /g, '<span ')
    .replace(/<\/(a|button|input|select)>/g, '</span>')
    .replace(/<noscript>/g, '')
    .replace(/<\/noscript>/g, '')
}
