import './index.css'

import {
  onCurrentChange,
  valueToColor,
  current,
  onPaint
} from '../../stores/current.js'
import {
  generateIsVisible,
  generateGetAlpha,
  format,
  build,
  inRGB,
  Color,
  parse
} from '../../lib/colors.js'
import { visible } from '../../stores/visible.js'
import { getCleanCtx, initCanvasSize } from '../../lib/canvas.js'

function initRange(
  type: 'l' | 'c' | 'h' | 'a'
): [HTMLDivElement, HTMLInputElement] {
  let div = document.querySelector<HTMLDivElement>(`.range.is-${type}`)!
  let range = div.querySelector<HTMLInputElement>('.range_input')!

  range.addEventListener('change', () => {
    current.setKey(type, parseFloat(range.value))
  })

  return [div, range]
}

let [rangeL, inputL] = initRange('l')
let [rangeC, inputC] = initRange('c')
let [rangeH, inputH] = initRange('h')
let [rangeA, inputA] = initRange('a')

let canvasL = rangeL.querySelector<HTMLCanvasElement>('.range_space')!
let canvasC = rangeC.querySelector<HTMLCanvasElement>('.range_space')!
let canvasH = rangeH.querySelector<HTMLCanvasElement>('.range_space')!

function paint(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  hasGaps: boolean,
  showP3: boolean,
  showRec2020: boolean,
  getColor: (x: number) => Color
): void {
  let getAlpha = generateGetAlpha(showP3, showRec2020)
  let isVisible = generateIsVisible(showP3, showRec2020)

  let ctx = getCleanCtx(canvas)
  let halfHeight = Math.floor(height / 2)
  let background = window
    .getComputedStyle(canvas)
    .getPropertyValue('--current-surface')

  for (let x = 0; x <= width; x++) {
    let color = getColor(x)
    if (!isVisible(color)) {
      if (hasGaps) {
        continue
      } else {
        return
      }
    }
    if (!inRGB(color)) {
      ctx.fillStyle = format(color)
      ctx.fillRect(x, halfHeight, 1, height)

      ctx.fillStyle = background
      ctx.fillRect(x, 0, 1, halfHeight)

      color.alpha = getAlpha(color)
      ctx.fillStyle = format(color)
      ctx.fillRect(x, 0, 1, halfHeight)
    } else {
      ctx.fillStyle = format(color)
      ctx.fillRect(x, 0, 1, height)
    }
  }
}

onCurrentChange({
  l(value) {
    inputL.value = String(value)
  },
  c(value) {
    inputC.value = String(value)
  },
  h(value) {
    inputH.value = String(value)
  },
  alpha(value) {
    inputA.value = String(value)
  }
})

onPaint({
  ch(value, showP3, showRec2020) {
    let color = valueToColor(value)
    let c = color.c
    let h = color.h ?? 0
    let [width, height] = initCanvasSize(canvasL)
    let factor = L_MAX / width
    paint(canvasL, width, height, true, showP3, showRec2020, x => {
      return build(x * factor, c, h)
    })
  },
  lh(value, showP3, showRec2020) {
    let color = valueToColor(value)
    let l = color.l
    let h = color.h ?? 0
    let [width, height] = initCanvasSize(canvasC)
    let factor = C_MAX / width
    paint(canvasC, width, height, false, showP3, showRec2020, x => {
      return build(l, x * factor, h)
    })
  },
  lc(value, showP3, showRec2020) {
    let { l, c } = valueToColor(value)
    let [width, height] = initCanvasSize(canvasH)
    let factor = H_MAX / width
    paint(canvasH, width, height, true, showP3, showRec2020, x => {
      return build(l, c, x * factor)
    })
  }
})

visible.subscribe(({ real, fallback }) => {
  let color = real || fallback
  document.body.style.setProperty('--range-color', real || fallback)
  rangeA.style.setProperty(
    '--range-from',
    format({ ...parse(color), alpha: 0 })
  )
})