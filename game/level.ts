import { readFileSync } from 'fs'
import domParser, { HTMLElement, Node, TextNode } from 'node-html-parser'
import { parse } from 'yaml'
import { isValue } from '../util/collection'
import { findNodes } from '../util/tree'

export type LevelFile = {
  url: string
  rootComponent: Component
  apis: Api[]
}

export interface Level {
  url: string
  styles: string[]
  rootComponent: Component
  totalComponents: number
  apis: Api[]
}

export interface Api {
  name: string
  type: 'cms' | 'commerce' | 'social'
  contentTypes: ApiContentType[]
}
export interface ApiContentType {
  name: string
  fields: ApiField[]
}

export interface ApiField {
  type: ApiFieldType
  name: string
}

export type ApiFieldType =
  | 'text'
  | 'number'
  | 'image'
  | 'yes/no'
  | 'reference'
  | 'list'

export interface Component {
  type: string
  selector: string
  forEach?: ForEach
  api?: string
  horizontalScrollSelector?: string
  // enhanced:
  id: string
  html: string
  codeLines: CodeLine[]
  children?: Component[]
}

export type ForEach = {
  length: number
  subSelector?: string
  api: string
  ids: string[]
}

export type ElementCodeLine = {
  type: 'element'
  indent: number
  element: string
  classes: string[]
}

export type ComponentSlotCodeLine = {
  type: 'component-slot'
  indent: number
  component: string
}
export type TextCodeLine = {
  type: 'text'
  indent: number
  text: string
}

export type ForEachLine = {
  type: 'for-each'
  indent: number
  component: string
}

export type CodeLine =
  | ElementCodeLine
  | ComponentSlotCodeLine
  | TextCodeLine
  | ForEachLine

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

  enhanceComponent(
    levelFile.rootComponent,
    dom.querySelector(levelFile.rootComponent.selector)!,
    '0',
  )

  const totalComponents = [...findNodes(levelFile.rootComponent, () => true)]
    .length

  return {
    url: levelFile.url,
    apis: levelFile.apis,
    styles: getStyles(dom, origin),
    rootComponent: levelFile.rootComponent,
    totalComponents,
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

export const enhanceComponent = (
  component: Component,
  dom: HTMLElement,
  id: string,
) => {
  // Register id
  component.id = id

  // Add horizontal scroll
  if (component.horizontalScrollSelector) {
    dom
      .querySelector(component.horizontalScrollSelector)
      ?.setAttribute('data-action-zone', 'horizontal-scroll')
  }

  // Register component-slots
  component.children?.forEach((child, i) => {
    if (child.forEach) {
      child.forEach.ids = []
      for (let fi = 0; fi < child.forEach.length; fi++) {
        const itemSelector = child.selector.replace('(index)', `(${fi + 1})`)
        const childSelector = itemSelector + (child.forEach?.subSelector ?? '')
        const childDom = dom.querySelector(childSelector)
        if (!childDom) {
          throw new Error(`Could not find ${childSelector}`)
        }
        child.forEach.ids[fi] = `${id}.${fi}`
        childDom.setAttribute('data-component-id', `${id}.${fi}`)
        enhanceComponent(child, childDom, `${id}.x`)
        dom
          .querySelector(itemSelector)
          ?.setAttribute('data-for-each-index', fi.toString())
        dom
          .querySelector(childSelector)
          ?.setAttribute('data-action-zone', 'component-slot')
      }
    } else {
      const childDom = dom.querySelector(child.selector)
      if (!childDom) {
        throw new Error(`Could not find ${child.selector}`)
      }
      childDom.setAttribute('data-component-id', `${id}.${i}`)
      enhanceComponent(child, childDom, `${id}.${i}`)
      dom
        .querySelector(child.selector)
        ?.setAttribute('data-action-zone', 'component-slot')
    }
  })

  component.codeLines ??= [...getCodeLines(dom, component)]

  component.html ??= getSanitizedHtml(dom)
}
export const sanitizeClasses = (value: string) =>
  /__[0-9A-Z]{5}$}/.test(value)
    ? value.replace(/__[0-9A-Z]{4}$}/, '')
    : value.replace(/[\w-]+(--|__)/g, '')

export const getSanitizedHtml = (dom: HTMLElement) => {
  dom.querySelectorAll('input').forEach((d) => d.setAttribute('readonly', ''))
  return dom?.outerHTML
    .replace(/<(a|button|select) /g, '<span ')
    .replace(/<\/(a|button|input|select)>/g, '</span>')
    .replace(/<noscript>/g, '')
    .replace(/<\/noscript>/g, '')
}

export function* getCodeLines(
  dom: Node,
  component: Component,
  indent = 0,
  counters = { childIndex: 0, forEachIndex: 0 },
): Iterable<CodeLine> {
  if (dom instanceof TextNode) {
    yield {
      indent,
      type: 'text',
      text: dom.text.replace(/\n/g, ' '),
    }
  } else if (dom instanceof HTMLElement) {
    if (['noscript', 'meta'].includes(dom.tagName.toLowerCase())) return

    yield {
      indent,
      type: 'element',
      element: dom.tagName.toLowerCase(),
      classes: [...dom.classList.values()].map(sanitizeClasses).filter(Boolean),
    }

    let i = indent + 1
    for (const child of dom.childNodes) {
      if (!(child instanceof HTMLElement)) {
        yield* getCodeLines(child, component, indent + 1, counters)
        continue
      }

      const forEachIndexAttribute = child.getAttribute('data-for-each-index')

      if (forEachIndexAttribute !== undefined) {
        counters.forEachIndex = Number(forEachIndexAttribute)

        if (counters.forEachIndex === 0) {
          const childComponent = component.children?.[counters.childIndex]!
          yield {
            indent: i++,
            type: 'for-each',
            component: childComponent.type,
          }
        } else {
          continue
        }
      }

      const isComponentSlot =
        child.getAttribute('data-action-zone') === 'component-slot'

      if (isComponentSlot) {
        const childComponent = component.children?.[counters.childIndex]!
        yield {
          indent: i,
          type: 'component-slot',
          component: childComponent.type,
        }
        if (!counters.forEachIndex) {
          counters.childIndex++
        }
      } else {
        yield* getCodeLines(child, component, i, counters)
      }
    }
  }
}

export const codeLinesToString = (codeLines: CodeLine[]) =>
  codeLines.map((c) => '  '.repeat(c.indent) + codeLineToString(c)).join('\n')

export const codeLineToString = (codeLine: CodeLine) => {
  switch (codeLine.type) {
    case 'component-slot':
      return `{ ${codeLine.component} }`
    case 'element':
      return codeLine.element + codeLine.classes.map((c) => '.' + c).join('')
    case 'for-each':
      return `for-each ${codeLine.component}s`
    case 'text':
      return `"${codeLine.text}"`
    default:
      return ''
  }
}
