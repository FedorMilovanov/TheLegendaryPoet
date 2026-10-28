// Painted-background contrast sweep.
//
// `qa/contrast-helpers.mjs` composites the *computed* `background-color` of the
// ancestor chain. That cannot see what the browser actually paints behind a
// glyph: gradients, background images, blend modes and stacked alpha are all
// invisible to it. This sweep paints the page once with every glyph made
// transparent, screenshots it, and composes each node's real computed ink over
// the dominant pixel colour of the box that renders behind that node.
//
// That difference is not academic: on /ratings the light theme repainted text
// ink but never the hard-coded `bg-[#071018]` panels, so the measured contrast
// of the table dropped to 1.28 while the computed model stayed silent.
//
// Nodes whose ink is fully transparent (`text-transparent` + `bg-clip-text`
// gradient wordmarks) have no ink colour to composite. They are reported
// separately in `gradientInk` instead of being scored as a fake 1.0 ratio.

const COLLECT_NODES = () => {
  const seen = new Set();
  const text = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walk.nextNode(); node; node = walk.nextNode()) {
    const value = node.textContent.trim();
    if (!value) continue;
    const el = node.parentElement;
    if (!el || seen.has(el)) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || Number(style.opacity) < 0.05) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    seen.add(el);
    text.push({
      text: value.slice(0, 70),
      color: style.color,
      fontSize: parseFloat(style.fontSize),
      fontWeight: Number(style.fontWeight),
      rect: { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height },
      className: (el.className ?? '').toString().slice(0, 140),
      tag: el.tagName,
    });
  }
  const icons = [];
  for (const svg of document.querySelectorAll('svg')) {
    const style = getComputedStyle(svg);
    const rect = svg.getBoundingClientRect();
    if (style.visibility === 'hidden' || Number(style.opacity) < 0.05 || rect.width < 6 || rect.height < 6) continue;
    icons.push({
      text: `<svg ${svg.getAttribute('aria-hidden') === 'true' ? 'decorative' : 'labelled'}>`,
      color: style.color,
      fontSize: rect.height,
      fontWeight: 400,
      rect: { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height },
      className: (svg.getAttribute('class') ?? '').slice(0, 90),
      tag: 'svg',
    });
  }
  return { text, icons };
};

const HIDE_INK = `*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important;
  text-shadow: none !important; }
  svg { visibility: hidden !important; }`;

const MEASURE = async ({ shot, nodes, minimum, minimumLarge, minimumIcon }) => {
  const img = new Image();
  img.src = `data:image/png;base64,${shot}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0);
  const all = context.getImageData(0, 0, img.width, img.height).data;

  const parse = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/i);
    if (match) {
      const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return [parts[0], parts[1], parts[2], Number.isFinite(parts[3]) ? parts[3] : 1];
    }
    // Tailwind serializes some palette colours as oklab()/oklch(). Let the
    // browser convert them instead of guessing.
    const probe = document.createElement('canvas');
    probe.width = probe.height = 1;
    const probeContext = probe.getContext('2d');
    probeContext.fillStyle = value;
    probeContext.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = probeContext.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const luminance = (rgb) => rgb
    .map((channel) => channel / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0);
  const ratioOf = (foreground, background) => {
    const a = luminance(foreground);
    const b = luminance(background);
    return Number(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(4));
  };
  const sample = (rect) => {
    const x0 = Math.max(0, Math.round(rect.x));
    const y0 = Math.max(0, Math.round(rect.y));
    const x1 = Math.min(img.width, Math.round(rect.x + rect.width));
    const y1 = Math.min(img.height, Math.round(rect.y + rect.height));
    if (x1 <= x0 || y1 <= y0) return null;
    const histogram = new Map();
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = 4 * (y * img.width + x);
        const key = `${all[i]},${all[i + 1]},${all[i + 2]}`;
        histogram.set(key, (histogram.get(key) ?? 0) + 1);
      }
    }
    let best = null;
    let bestCount = 0;
    for (const [key, count] of histogram) if (count > bestCount) { best = key; bestCount = count; }
    return best.split(',').map(Number);
  };

  const rows = [];
  const gradientInk = [];
  for (const node of nodes) {
    const background = sample(node.rect);
    if (!background) continue;
    const ink = parse(node.color);
    if (ink[3] === 0) {
      gradientInk.push({ ...node, background });
      continue;
    }
    const foreground = [0, 1, 2].map((i) => ink[i] * ink[3] + background[i] * (1 - ink[3]));
    const large = node.fontSize >= 24 || (node.fontSize >= 18.66 && node.fontWeight >= 700);
    const minimumForNode = node.tag === 'svg' ? minimumIcon : large ? minimumLarge : minimum;
    rows.push({
      ...node,
      background,
      ratio: ratioOf(foreground, background),
      minimum: minimumForNode,
    });
  }
  return { rows, gradientInk };
};

export async function paintedSweep(page, options = {}) {
  const { minimum = 4.5, minimumLarge = 3, minimumIcon = 3 } = options;
  const nodes = await page.evaluate(COLLECT_NODES);
  const style = await page.addStyleTag({ content: HIDE_INK });
  await page.waitForTimeout(250);
  const shot = (await page.screenshot({ fullPage: true })).toString('base64');
  await style.evaluate((node) => node.remove());
  const { rows, gradientInk } = await page.evaluate(MEASURE, {
    shot,
    nodes: [...nodes.text, ...nodes.icons],
    minimum,
    minimumLarge,
    minimumIcon,
  });
  return {
    measured: rows,
    offenders: rows.filter((row) => row.ratio < row.minimum).sort((a, b) => a.ratio - b.ratio),
    gradientInk,
  };
}

export function describeOffenders(offenders) {
  return offenders
    .slice(0, 12)
    .map((row) => `${row.ratio} < ${row.minimum} — "${row.text.slice(0, 32)}" ink ${row.color} on painted [${row.background.join(', ')}] :: ${row.className.slice(0, 60)}`)
    .join('\n');
}
