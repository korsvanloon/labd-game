import { readFileSync } from 'fs'
import domParser, { HTMLElement } from 'node-html-parser'

import { parse } from 'yaml'
import { isValue } from './collection'

export type LevelFile = {
  url: string
  rootComponent: Component
}

export interface Level {
  url: string
  styles: string[]
  rootComponent: Component
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

export const readLevelFile = (name: string): LevelFile =>
  parse(readFileSync(`./data/levels/${name}.yaml`, 'utf-8')) as LevelFile

export const createLevel = (
  pageHtmlString: string,
  levelFile: LevelFile,
): Level => {
  const origin = new URL(levelFile.url).origin

  const dom = domParser.parse(pageHtmlString, {})

  enhanceComponent(levelFile.rootComponent, dom, '0')

  return {
    url: levelFile.url,
    styles: getStyles(dom, origin),
    rootComponent: levelFile.rootComponent,
  }
}

export const getStyles = (dom: HTMLElement, origin: string) =>
  [
    ...dom
      .querySelectorAll('link[rel=stylesheet]')
      .map((link) => link.getAttribute('href'))
      .map((href) => (href?.startsWith('http') ? href : `${origin}${href}`)),
    ...dom
      .querySelectorAll('style[data-href]')
      .map((link) => link.getAttribute('data-href')),
  ].filter(isValue)

const enhanceComponent = (
  component: Component,
  dom: HTMLElement,
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
    enhanceComponent(child, componentDom, `${id}.${i}`)
    const childDom = componentDom.querySelector(child.selector)
    childDom?.classList.add('drop-zone')
  })

  component.structure = getStructure(componentDom)

  component.html = getSanitizedHtml(componentDom)
}
export const sanitizeClasses = (value: string) =>
  value.replace(/[\w-]+(--|__)/g, '')

export const getStructure = (dom: HTMLElement, lastDropZoneIndent = -1) =>
  dom.structure
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
        /^noscript|^meta|^div\.component-id/.test(line)
      ) {
        lastDropZoneIndent = indent - 1
      }
      return lastDropZoneIndent === -1 || indent <= lastDropZoneIndent
    })

export const getSanitizedHtml = (dom: HTMLElement) => {
  dom.querySelectorAll('input').forEach((d) => d.setAttribute('readonly', ''))
  return dom?.outerHTML
    .replace(/<(a|button|select) /g, '<span ')
    .replace(/<\/(a|button|input|select)>/g, '</span>')
    .replace(/<noscript>/g, '')
    .replace(/<\/noscript>/g, '')
}
