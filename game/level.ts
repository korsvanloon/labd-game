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
  selector?: string
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

export type FieldCodeLine = {
  type: 'field'
  indent: number
  name: string
  fieldType: ApiFieldType
}

export type CodeLine =
  | ElementCodeLine
  | ComponentSlotCodeLine
  | TextCodeLine
  | ForEachLine
  | FieldCodeLine

export type CopyContent = {
  selector: string
}

export const readLevelFile = (name: string): LevelFile =>
  parse(readFileSync(`./data/levels/${name}.yaml`, 'utf-8')) as LevelFile

export const readLevelHtml = (name: string): string =>
  readFileSync(`./data/sites/${name}.html`, 'utf-8')

export const createLevel = (
  pageHtmlString: string,
  levelFile: LevelFile,
): Level => {
  const origin = new URL(levelFile.url).origin

  const dom = domParser.parse(pageHtmlString, {})

  dom.querySelectorAll('script,noscript,meta').forEach((e) => e.remove())
  dom
    .querySelectorAll('img')
    .filter((e) => e.getAttribute('src')?.startsWith('/'))
    .forEach((e) => e.setAttribute('src', origin + e.getAttribute('src')))
  dom
    .querySelectorAll('source')
    .filter((e) => e.getAttribute('srcset')?.startsWith('/'))
    .forEach((e) => e.setAttribute('srcset', origin + e.getAttribute('srcset')))

  const rootDom = dom.querySelector(levelFile.rootComponent.selector)!
  dom.querySelectorAll('style').forEach((style) => rootDom.appendChild(style))

  enhanceComponent(levelFile.rootComponent, rootDom, '0', levelFile.apis)

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
      .filter((link) => !link.getAttribute('media'))
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
  apis: Api[],
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
      const forEachDoms = dom.querySelectorAll(child.selector)
      child.forEach.ids = forEachDoms.map((_, fi) => `${id}.${fi}`)
      child.forEach.length = child.forEach.ids.length

      for (const [fi, forEachDom] of forEachDoms.entries()) {
        const childDom = child.forEach.subSelector
          ? forEachDom.querySelector(child.forEach!.subSelector!)!
          : forEachDom

        child.forEach.ids[fi] = `${id}.${fi}`
        childDom.setAttribute('data-component-id', `${id}.${fi}`)
        enhanceComponent(child, childDom, `${id}.x`, apis)
        forEachDom.setAttribute('data-for-each-index', fi.toString())
        childDom.setAttribute('data-action-zone', 'component-slot')
      }
    } else {
      const childDom = dom.querySelector(child.selector)
      if (!childDom) {
        throw new Error(`Could not find ${child.selector}`)
      }
      childDom.setAttribute('data-component-id', `${id}.${i}`)
      enhanceComponent(child, childDom, `${id}.${i}`, apis)
      dom
        .querySelector(child.selector)
        ?.setAttribute('data-action-zone', 'component-slot')
    }
  })

  const [apiName, contentTypeName] = component.forEach?.api.split('.') ?? []
  const api = apis?.find((a) => a.name === apiName)
  const fieldNodes = api?.contentTypes
    ?.find((type) => type.name === contentTypeName)
    ?.fields?.map((field) => ({
      field,
      node:
        field.selector && dom ? [...dom.querySelectorAll(field.selector)] : dom,
    }))

  component.codeLines ??= [...getCodeLines(dom, component, fieldNodes)]

  component.html ??= getSanitizedHtml(dom)
}

export const getSanitizedHtml = (dom: HTMLElement) => {
  dom.querySelectorAll('input').forEach((d) => d.setAttribute('readonly', ''))
  return dom?.outerHTML
    .replace(/<(a|button|select) /g, '<span ')
    .replace(/<\/(a|button|input|select)>/g, '</span>')
    .replace(/<noscript>/g, '')
    .replace(/<\/noscript>/g, '')
}

type FieldNode = {
  nodes?: HTMLElement[]
  field: ApiField
}

export function* getCodeLines(
  dom: Node,
  component: Component,
  fieldNodes?: FieldNode[],
  indent = 0,
  counters = { childIndex: 0, forEachIndex: 0 },
): Iterable<CodeLine> {
  const apiField = fieldNodes?.find((n) => n.nodes?.includes(dom.parentNode))

  if (apiField) {
    yield {
      indent,
      type: 'field',
      name: apiField.field.name,
      fieldType: apiField.field.type,
    }
  } else if (dom instanceof TextNode) {
    if (dom.text.startsWith('<!--') || !dom.text.trim()) return
    yield {
      indent,
      type: 'text',
      text: dom.text.replace(/\n/g, ' ').trim(),
    }
  } else if (dom instanceof HTMLElement) {
    if (['noscript', 'meta'].includes(dom.tagName.toLowerCase())) return

    yield {
      indent,
      type: 'element',
      element: dom.tagName.toLowerCase(),
      classes: [...dom.classList.values()].map(sanitizeClasses).filter(Boolean),
    }

    if (['svg'].includes(dom.tagName.toLowerCase())) return

    let i = indent + 1
    for (const child of dom.childNodes) {
      if (!(child instanceof HTMLElement)) {
        yield* getCodeLines(child, component, fieldNodes, indent + 1, counters)
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
        yield* getCodeLines(child, component, fieldNodes, i, counters)
      }
    }
  }
}

export const sanitizeClasses = (value: string) =>
  /__[0-9A-Za-z]{5}$/.test(value) && !/__[a-z]{5}$/.test(value)
    ? value.replace(/__[0-9A-Za-z]{5}$/, '')
    : value.replace(/[\w-]+(--|__)/g, '')

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
