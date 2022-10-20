import domParser from 'node-html-parser'
import { getStructure, StructureLine } from '../../game/level'

const htmlString = `<div class="container"><div class="d-flex"><div class="n-header__usps flex-fill px-0"><div class="row font-weight-bold"><div class="col-auto"><i class="fas fa-check mr-1"></i>Gratis verzending vanaf €&nbsp;39,-</div><div class="col-auto"><i class="fas fa-check mr-1"></i>Voor 21:00 besteld, vandaag verzonden</div><div class="col-auto"><i class="fas fa-check mr-1"></i>90 dagen gratis retour *</div></div></div><div class="n-header__links text--right px-0"><a class="n-header__link n-header__link--topbar" href="/informatie/">Klantenservice</a><button class="n-header__link n-header__link--flag btn" aria-label="Kies taal"><span class="flag-icon flag-icon-nl"></span><i class="fas fa-angle-down ml-2"></i></button></div></div></div>`
const dom = domParser.parse(htmlString).querySelector('>*')!

it('should parse structure correctly', () => {
  const result = printStructure(getStructure(dom))
  expect(result).toEqual(
    `div.container
  div.d-flex
    div.usps.flex-fill.px-0
      div.row.font-weight-bold
        div.col-auto
          i.fas.fa-check.mr-1
          #text
        div.col-auto
          i.fas.fa-check.mr-1
          #text
        div.col-auto
          i.fas.fa-check.mr-1
          #text
    div.links.right.px-0
      a.link.topbar
        #text
      button.link.flag.btn
        span.flag-icon.flag-icon-nl
        i.fas.fa-angle-down.ml-2`,
  )
})

const printStructure = (structure: StructureLine[]) =>
  structure
    .map(({ indent, line }) => `${'  '.repeat(indent)}${line}`)
    .join('\n')
