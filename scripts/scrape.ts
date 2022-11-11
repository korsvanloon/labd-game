import fs, { writeFileSync } from 'fs'
import path from 'path'
import postcss, { PluginCreator } from 'postcss'
import urlPlugin from 'postcss-url'
import {
  getDom,
  getStyleLinkUrls,
  LevelFile,
  readLevelFile,
} from '../game/level'

async function main() {
  const levelNames = fs
    .readdirSync('./data/levels')
    .map((name) => name.replace(path.extname(name), ''))

  for (const levelName of levelNames) {
    const levelFile = readLevelFile(levelName)

    const htmlString = await fetch(levelFile.url).then((r) => r.text())

    writeFileSync(`data/sites/${levelName}.html`, htmlString)

    await writeStyles(levelName, levelFile, htmlString)
  }
}

main()

async function writeStyles(
  levelName: string,
  levelFile: LevelFile,
  htmlString: string,
) {
  const origin = new URL(levelFile.url).origin

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
      selector === ':root'
        ? opts.selector
        : // This is part of a keyframe
        /^([0-9]*[.])?[0-9]+\%$|^from$|^to$/.test(selector) ||
          selector.startsWith(opts.selector.trim())
        ? selector
        : opts.selector + selector,
    )
  },
})
prefixSelectorPlugin.postcss = true
