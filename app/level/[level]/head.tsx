import { existsSync, writeFileSync } from 'fs'
import postcss, { PluginCreator } from 'postcss'
import {
  getDom,
  getStyleLinkUrls,
  readLevelFile,
  readLevelHtml,
} from '../../../game/level'
import urlPlugin from 'postcss-url'

type Props = {
  params: {
    level: string
  }
}

export default async function Head({ params: { level } }: Props) {
  if (!existsSync(`./public/styles/${level}.css`)) {
    await writeStyles(level)
  }

  return (
    <>
      <link
        //  @ts-ignore
        precedence="default"
        rel="stylesheet"
        href={`/styles/${level}.css`}
      />
    </>
  )
}

async function writeStyles(levelName: string) {
  const levelFile = readLevelFile(levelName)
  const origin = new URL(levelFile.url).origin

  const htmlString = existsSync(`./data/sites/${levelName}.html`)
    ? readLevelHtml(levelName)
    : await fetch(levelFile.url).then((r) => r.text())

  const dom = getDom(htmlString)

  const styles = await Promise.all(
    getStyleLinkUrls(dom, origin).map((url) =>
      fetch(url).then((r) => r.text()),
    ),
  )

  styles.push(
    ...dom.querySelectorAll('style').map((style) => style.textContent),
  )

  // todo relative paths

  const style = (
    await postcss(
      prefixSelectorPlugin({ selector: '.browser ' }),
      urlPlugin({
        url: (asset: any) =>
          asset.url.startsWith('/') ? origin + asset.url : asset.url,
      }),
    ).process(styles.join('\n'))
  ).toString()

  writeFileSync(`./public/styles/${levelName}.css`, style)
}

const prefixSelectorPlugin: PluginCreator<{ selector: string }> = (
  opts = { selector: '' },
) => ({
  postcssPlugin: 'prepend-selector',
  Rule: (rule) => {
    rule.selectors = rule.selectors.map((selector) =>
      // This is part of a keyframe
      /^([0-9]*[.])?[0-9]+\%$|^from$|^to$/.test(selector) ||
      selector.startsWith(opts.selector.trim())
        ? selector
        : opts.selector + selector,
    )
  },
})
prefixSelectorPlugin.postcss = true
