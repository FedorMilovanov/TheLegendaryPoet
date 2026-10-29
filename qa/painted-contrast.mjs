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
// Bands are captured as *viewport* screenshots while the page is scrolled to
// the band's offset, never as a clipped full-page bitmap. A full-page capture
// paints floating chrome (header, mobile dock, consent banner, command palette
// scrim) at its viewport offset over the top of the document, so copy that
// actually sits hundreds of pixels lower ends up sampled against the chrome's
// surface instead of its own. Scrolling first paints the chrome where the
// reader sees it, which is the only geometry in which the sample means
// anything.
//
// Nodes whose ink is fully transparent (`text-transparent` + `bg-clip-text`
// gradient wordmarks) have no ink colour to composite. They are reported
// separately in `gradientInk` instead of being scored as a fake 1.0 ratio.

const COLLECT_NODES = () => {
  const seen = new Set();
  const text = [];
  const inactive = [];
  const occluded = [];
  // Floating chrome (the fixed mobile dock and the site header) is painted once
  // in a full-page capture, at its viewport offset, and covers whatever sits
  // under it at that scroll position. A node behind it is not low-contrast copy:
  // it is temporarily hidden and scrolls clear, so it is reported, not scored —
  // the same contract as decorative icons and disabled controls. Decorative
  // fixed layers are skipped: `.noise-bg` is pointer-transparent and paints a
  // 2% grain, and the ambient fields carry no surface of their own.
  const hasSurface = (style) => {
    if (style.backgroundImage !== 'none') return true;
    if (style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent') return false;
    const alpha = Number((style.backgroundColor.match(/rgba?\([^)]*,\s*([\d.]+)\)/) ?? [])[1] ?? 1);
    return alpha >= 0.5;
  };
  const overlays = [];
  const pushOverlay = (el, clip) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const box = { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
    if (clip && !(box.x < clip.x + clip.width && box.x + box.width > clip.x && box.y < clip.y + clip.height && box.y + box.height > clip.y)) return;
    overlays.push({ el, ...box, tag: el.tagName, cls: (el.className ?? '').toString().slice(0, 48) });
  };
  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.position !== 'fixed' || style.pointerEvents === 'none') continue;
    if (style.visibility === 'hidden' || Number(style.opacity) < 0.05) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const clip = { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
    // The fixed layer itself may only be a frame: the mobile dock paints its
    // surface on an inner rail, so descendants that paint one count too.
    if (hasSurface(style)) pushOverlay(el, null);
    for (const child of el.querySelectorAll('*')) {
      if (getComputedStyle(child).visibility === 'hidden') continue;
      if (hasSurface(getComputedStyle(child))) pushOverlay(child, clip);
    }
  }
  // The chrome's own labels sit *inside* the overlay and are painted on top of
  // it: they are readable and stay in the scored set.
  const occludedBy = (rect, el) => overlays.find((overlay) => rect.x < overlay.x + overlay.width
    && rect.x + rect.width > overlay.x
    && rect.y < overlay.y + overlay.height
    && rect.y + rect.height > overlay.y
    && !overlay.el.contains(el)
    && !el.contains(overlay.el));
  // Index of the floating layer this node is painted inside, or -1 for ordinary
  // document copy. Bands are sampled at several scroll offsets, so a node can
  // be covered by chrome in one offset and clear in another; the sweep needs to
  // tell "hidden behind chrome" apart from "painted on chrome".
  const overlayOf = (el) => overlays.findIndex((overlay) => overlay.el.contains(el));
  // Every scored node gets an id so the sweep can ask for its live box at the
  // moment of each capture. Document coordinates plus a scroll offset are not
  // enough: the box a reader sees is the one the browser lays out now, and
  // `position: sticky` and `position: fixed` nodes do not move with the scroll.
  let sweepId = 0;
  const tag = (el) => {
    const existing = el.getAttribute('data-sweep-node');
    if (existing !== null) return Number(existing);
    const id = sweepId;
    sweepId += 1;
    el.setAttribute('data-sweep-node', String(id));
    return id;
  };
  // WCAG 1.4.3 exempts inactive user interface components. A disabled submit
  // button is not a contrast defect; report it, do not fail the page on it.
  const isInactive = (el) => el.closest('[disabled], [aria-disabled="true"], fieldset[disabled]') !== null;
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  // Gradient-clipped elements paint their ink from background-image, so their
  // `color` is only a fallback. Score them once, in the gradient pass.
  const gradientBoxes = new Set();
  for (const el of document.querySelectorAll('*')) {
    const style = getComputedStyle(el);
    const clip = `${style.webkitBackgroundClip || ''} ${style.backgroundClip || ''}`;
    if (/\btext\b/.test(clip) && style.backgroundImage.includes('gradient')) gradientBoxes.add(el);
  }
  // The element box is not the text. A heading that wraps a gradient-clipped
  // span — the home "Лица Эпохи", the ratings "Поэты в оценке читателей" —
  // paints that span's gradient inside its own box, and sampling the element
  // rectangle scores the heading against a neighbour's ink. Measure the run of
  // glyphs itself, and remember which run it was so it can be found again.
  // Consecutive lines of the same width are one block: a paragraph is then a
  // single box, while a paragraph wrapping a floated figure becomes the narrow
  // lines beside it plus the full-width lines below it, so each block is scored
  // against the surface its own glyphs rest on.
  const mergeRuns = (runs) => {
    const blocks = [];
    for (const run of runs) {
      const last = blocks[blocks.length - 1];
      if (last
        && Math.abs(last.x - run.x) <= 1
        && Math.abs(last.width - run.width) <= 1
        && run.y - (last.y + last.height) <= 2) {
        last.height = run.y + run.height - last.y;
        continue;
      }
      blocks.push({ x: run.x, y: run.y, width: run.width, height: run.height });
    }
    return blocks;
  };
  const runRects = (node, floor = 2) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const runs = [...range.getClientRects()].filter((run) => run.width >= floor && run.height >= floor);
    return mergeRuns(runs);
  };
  const union = (blocks) => {
    const left = Math.min(...blocks.map((run) => run.x));
    const top = Math.min(...blocks.map((run) => run.y));
    const right = Math.max(...blocks.map((run) => run.x + run.width));
    const bottom = Math.max(...blocks.map((run) => run.y + run.height));
    return { x: left, y: top, width: right - left, height: bottom - top };
  };
  const runRect = (node) => {
    const blocks = runRects(node);
    if (!blocks.length) return null;
    const rect = union(blocks);
    return rect.width < 2 || rect.height < 2 ? null : rect;
  };
  const textRuns = (el) => [...el.childNodes].filter((child) => child.nodeType === 3 && child.textContent.trim());
  for (let node = walk.nextNode(); node; node = walk.nextNode()) {
    const value = node.textContent.trim();
    if (!value) continue;
    const el = node.parentElement;
    if (!el || seen.has(el) || gradientBoxes.has(el)) continue;
    if (isInactive(el)) { inactive.push(el); continue; }
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || Number(style.opacity) < 0.05) continue;
    // Screen-reader-only text is clipped to a 1px box, but its glyphs still
    // report a full-size run. If the element's own box is clipped away, the
    // copy is not painted and has no contrast to score.
    const own = el.getBoundingClientRect();
    if (own.width < 2 || own.height < 2) continue;
    const rect = runRect(node);
    if (!rect) continue;
    seen.add(el);
    const box = { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
    // One box cannot describe a run that wraps a float: the essay that put a
    // media card beside its prose scored the paragraph against the card.
    const blocks = runRects(node).map((run) => ({
      x: run.x + window.scrollX, y: run.y + window.scrollY, width: run.width, height: run.height,
    }));
    const run = textRuns(el).indexOf(node);
    const cover = occludedBy(box, el);
    if (cover) {
      occluded.push({ text: value.slice(0, 50), by: `${cover.tag}.${cover.cls}` });
      continue;
    }
    text.push({
      text: value.slice(0, 70),
      color: style.color,
      fontSize: parseFloat(style.fontSize),
      fontWeight: Number(style.fontWeight),
      rect: box,
      blocks,
      id: tag(el),
      run,
      overlay: overlayOf(el),
      className: (el.className ?? '').toString().slice(0, 140),
      tag: el.tagName,
    });
  }
  // Gradient-clipped ink (`text-transparent` + `bg-clip-text` + a gradient
  // background) carries no colour to composite: its visible ink is the gradient
  // itself. Keep the stops and the light-theme brightness filter so the sweep
  // can score the ink that actually reaches the eye.
  const gradient = [];
  for (const el of document.querySelectorAll('*')) {
    const style = getComputedStyle(el);
    // Chromium reports the prefixed property; the unprefixed one stays border-box.
    const clip = `${style.webkitBackgroundClip || ''} ${style.backgroundClip || ''}`;
    if (!/\btext\b/.test(clip)) continue;
    if (!style.backgroundImage.includes('gradient')) continue;
    const text = el.textContent.trim();
    if (!text) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const gradientBox = { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
    if (occludedBy(gradientBox, el)) continue;
    const brightness = Number((style.filter.match(/brightness\(([\d.]+)\)/) ?? [])[1] ?? 1);
    // `color: transparent` cannot hide gradient-clipped glyphs: they are painted
    // by background-image. Tag the node so the sweep can strip that background
    // in a second pass and sample what really sits behind the word.
    el.setAttribute('data-sweep-gradient', '');
    gradient.push({
      text: text.slice(0, 70),
      color: style.color,
      overlay: overlayOf(el),
      stops: [...style.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map((m) => m[0]),
      id: tag(el),
      brightness,
      fontSize: parseFloat(style.fontSize),
      fontWeight: Number(style.fontWeight),
      rect: gradientBox,
      className: (el.className ?? '').toString().slice(0, 140),
      tag: el.tagName,
    });
  }
  // WCAG 1.4.11 covers graphics required to understand the content. An icon the
  // page hides from assistive tech, next to copy that already says the same
  // thing, is decorative: report it, do not fail the page on it.
  const icons = [];
  const decorativeIcons = [];
  for (const svg of document.querySelectorAll('svg')) {
    const style = getComputedStyle(svg);
    const rect = svg.getBoundingClientRect();
    if (style.visibility === 'hidden' || Number(style.opacity) < 0.05 || rect.width < 6 || rect.height < 6) continue;
    const iconBox = { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
    if (occludedBy(iconBox, svg)) continue;
    const decorative = svg.getAttribute('aria-hidden') === 'true' || svg.closest('[aria-hidden="true"]') !== null;
    const label = decorative ? 'decorative' : (svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent || 'labelled');
    const entry = {
      text: `<svg ${label}>`,
      color: style.color,
      overlay: overlayOf(svg),
      fontSize: rect.height,
      fontWeight: 400,
      rect: iconBox,
      id: tag(svg),
      className: (svg.getAttribute('class') ?? '').slice(0, 90),
      tag: 'svg',
      decorative,
    };
    if (decorative) decorativeIcons.push(entry); else icons.push(entry);
  }
  return {
    text,
    gradient,
    icons,
    decorativeIcons,
    inactive: [...new Set(inactive)].map((el) => el.textContent.trim().slice(0, 60)),
    occluded,
    overlays: overlays.map(({ el, ...rest }) => rest),
  };
};

const HIDE_INK = `*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important;
  text-shadow: none !important; }
  svg { visibility: hidden !important; }`;

// Second pass for gradient-clipped ink: drop the gradient itself so the box
// shows the surface behind the word, not the word's own fill.
const HIDE_GRADIENT_INK = `[data-sweep-gradient] { background-image: none !important; }`;

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
  // A glyph rarely sits on one flat colour. Gradients, soft shadows and cover
  // art paint a spread of surfaces inside a single text box, and on a smooth
  // ramp no single colour wins: the histogram is flat enough that "the most
  // frequent pixel" is an arbitrary pick, which is how one run measured the
  // home CTA at 4.39 and the next at 4.76 over the same pixels.
  //
  // So the sweep scores the ink against every surface that *meaningfully*
  // paints the box — each luminance band with at least this share of it — and
  // keeps the worst. Dither, grain and antialiased edges never reach the share,
  // so they cannot move the number; a real dark end of a ramp can.
  const SURFACE_SHARE = 0.05;
  // Rounded corners, borders and antialiased edges are not the surface a glyph
  // sits on: a `rounded-full` pill leaves its own page background showing in the
  // corners of its box, which is a fifth of the area and none of the backdrop.
  // Sample the inset, where the paint the text actually rests on lives.
  const SURFACE_INSET = 0.12;
  const sample = (rect) => {
    const insetX = Math.min((rect.width - 1) / 2, rect.width * SURFACE_INSET);
    const insetY = Math.min((rect.height - 1) / 2, rect.height * SURFACE_INSET);
    const x0 = Math.max(0, Math.round(rect.x + insetX));
    const y0 = Math.max(0, Math.round(rect.y + insetY));
    const x1 = Math.min(img.width, Math.round(rect.x + rect.width - insetX));
    const y1 = Math.min(img.height, Math.round(rect.y + rect.height - insetY));
    if (x1 <= x0 || y1 <= y0) return null;
    const histogram = new Map();
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = 4 * (y * img.width + x);
        const key = `${all[i]},${all[i + 1]},${all[i + 2]}`;
        histogram.set(key, (histogram.get(key) ?? 0) + 1);
      }
    }
    const total = (x1 - x0) * (y1 - y0);
    // The inset can swallow a hairline block (a 2px-tall line box) completely.
    if (total <= 0) return null;
    let best = null;
    let bestCount = 0;
    const bands = new Map();
    for (const [key, count] of histogram) {
      if (count > bestCount) { best = key; bestCount = count; }
      const rgb = key.split(',').map(Number);
      const band = Math.round(luminance(rgb) / 0.01);
      const slot = bands.get(band) ?? { count: 0, colour: null, colourCount: 0 };
      slot.count += count;
      if (count > slot.colourCount) { slot.colourCount = count; slot.colour = rgb; }
      bands.set(band, slot);
    }
    if (best === null) return null;
    const dominant = best.split(',').map(Number);
    const surfaces = [...bands.values()]
      .filter((slot) => slot.count / total >= SURFACE_SHARE)
      .map((slot) => slot.colour);
    return { dominant, surfaces: surfaces.length ? surfaces : [dominant] };
  };

  const scoreGradient = (node, background) => {
    const large = node.fontSize >= 24 || (node.fontSize >= 18.66 && node.fontWeight >= 700);
    const threshold = large ? minimumLarge : minimum;
    // `filter: brightness(b)` scales sRGB channels; `contrast()` only pushes
    // dark stops further from mid grey, so ignoring it stays conservative.
    const ratios = node.stops.map((stop) => {
      const [r, g, b, a = 1] = parse(stop);
      const scaled = [r, g, b].map((channel) => Math.min(255, channel * node.brightness));
      const foreground = [0, 1, 2].map((i) => scaled[i] * a + background[i] * (1 - a));
      return ratioOf(foreground, background);
    });
    return { ratios, ratio: Math.min(...ratios), minimum: threshold, large };
  };

  // A run can occupy several blocks — prose that wraps a floated figure has
  // narrow lines beside it and full-width lines below it. Every block holds
  // glyphs, so every block is a surface the ink has to clear, and none of them
  // is the figure it wraps around.
  const surfacesOf = (node) => {
    const rects = node.blocks?.length ? node.blocks : [node.rect];
    const seen = new Set();
    const surfaces = [];
    let dominant = null;
    for (const rect of rects) {
      const sampled = sample(rect);
      if (!sampled) continue;
      dominant = dominant ?? sampled.dominant;
      for (const surface of sampled.surfaces) {
        const key = surface.join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        surfaces.push(surface);
      }
    }
    return surfaces.length ? { surfaces, dominant } : null;
  };
  const rows = [];
  const gradientInk = [];
  for (const node of nodes) {
    const sampled = surfacesOf(node);
    if (!sampled) continue;
    const large = node.fontSize >= 24 || (node.fontSize >= 18.66 && node.fontWeight >= 700);
    const minimumForNode = node.tag === 'svg' ? minimumIcon : large ? minimumLarge : minimum;
    const ink = parse(node.color);
    // Score the ink on every surface the box really paints and keep the worst:
    // that is the number a reader with the text over the dark end of the ramp
    // experiences, and it is the number that survives a re-run.
    const scored = sampled.surfaces.map((background) => {
      if (node.stops) return { background, ...scoreGradient(node, background) };
      if (ink[3] === 0) return { background, ratios: [], ratio: null, minimum: minimumForNode };
      const foreground = [0, 1, 2].map((i) => ink[i] * ink[3] + background[i] * (1 - ink[3]));
      return { background, ratio: ratioOf(foreground, background), minimum: minimumForNode };
    });
    const worst = scored.reduce((lowest, candidate) => (
      candidate.ratio !== null && (lowest.ratio === null || candidate.ratio < lowest.ratio) ? candidate : lowest
    ), scored[0]);
    if (node.stops || ink[3] === 0) {
      gradientInk.push({ ...node, ...worst, dominant: sampled.dominant });
      continue;
    }
    rows.push({ ...node, background: worst.background, ratio: worst.ratio, minimum: minimumForNode });
  }
  return { rows, gradientInk };
};

// Long pages (the poet page paints 16 845 px) cannot be decoded as one image:
// Chromium refuses the second full-page bitmap. Measure in horizontal bands so
// the sweep works on any document height, with both ink passes sharing the code.
// A band is never taller than the viewport: the capture is a viewport shot, so
// the sample must fit inside what the browser paints at that scroll offset.
export async function paintedSweep(page, options = {}) {
  const { minimum = 4.5, minimumLarge = 3, minimumIcon = 3 } = options;
  // Chrome is collected at a known scroll offset, so its boxes are viewport
  // boxes, which is exactly what fixed chrome keeps while the page scrolls.
  await page.evaluate(() => window.scrollTo(0, 0));
  // Collect once, but not before there is something to collect. An essay body
  // that has not laid its own prose out yet reports every paragraph at the top
  // of the document, so bands get cut from a page that is a fraction of its
  // real height and copy is scored against the hero it happens to be stacked
  // on. Wait for the height — and the type — to stop moving instead.
  await page.evaluate(() => Promise.race([
    (async () => {
      await document.fonts.ready;
      let previous = -1;
      let stable = 0;
      while (stable < 5) {
        const height = document.documentElement.scrollHeight;
        stable = height === previous ? stable + 1 : 0;
        previous = height;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => { setTimeout(resolve, 120); });
      }
    })(),
    new Promise((resolve) => { setTimeout(resolve, 8000); }),
  ]));
  const nodes = await page.evaluate(COLLECT_NODES);
  const { height, viewport } = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    viewport: document.documentElement.clientHeight,
  }));
  // A capture is one viewport tall, so a band cannot be taller than that.
  // The browser clamps the last offset to the final scrollable one, which is
  // why these are offsets to visit and not slices of the document.
  const bandHeight = Math.max(1, Math.min(2000, viewport));
  const maxScroll = Math.max(0, height - viewport);
  const offsets = [...new Set(Array.from(
    { length: Math.ceil(height / bandHeight) },
    (_, index) => Math.min(index * bandHeight, maxScroll),
  ))];

  // Floating chrome is fixed to the viewport, so its box is the same in every
  // band; only the copy scrolling underneath changes what it covers.
  const overlays = nodes.overlays;
  // A sticky table head parks one pixel under the site header and would be
  // reported as hidden forever. Chrome has to cover a real share of the box
  // before the copy counts as concealed rather than merely grazed.
  const COVERED_SHARE = 0.2;
  // A line the chrome merely grazes is still sampled partly on the chrome's own
  // paint, and that share is big enough to be scored as a surface. A block is
  // dropped as soon as chrome reaches the sampler's own surface share: a line
  // has to stand entirely in the open before it testifies about the ink.
  const GRAZE_SHARE = 0.05;
  const coverAt = (node, rect, share = COVERED_SHARE) => overlays.find((overlay, index) => {
    if (index === node.overlay) return false;
    const width = Math.min(rect.x + rect.width, overlay.x + overlay.width) - Math.max(rect.x, overlay.x);
    const height = Math.min(rect.y + rect.height, overlay.y + overlay.height) - Math.max(rect.y, overlay.y);
    if (width <= 0 || height <= 0) return false;
    return (width * height) / (rect.width * rect.height) >= share;
  });
  // The scroll offset that puts a node in the middle of the viewport, where no
  // chrome can reach it: the re-sample offset for copy its own band covered.
  // `seen` is where the node really was when a band last looked at it — the
  // document position gathered before the page finished loading its media can
  // be a thousand pixels away from where the copy ended up.
  const centerOn = (node, seen = null) => {
    const top = seen ? seen.offset + seen.y : node.rect.y;
    const height = seen ? seen.height : node.rect.height;
    const centred = Math.round(top + height / 2 - viewport / 2);
    return Math.max(0, Math.min(maxScroll, centred));
  };
  const settle = () => page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)));
  }));
  // A capture has to show the page a reader is left with. Photographs that are
  // still arriving reflow the copy around them, so a band photographed before
  // its own images land measures a layout that never settles — and blames the
  // ink for sitting on a picture it is not on. Decode what the band shows
  // first, with a ceiling so one stalled asset cannot hang the sweep.
  const settleBand = () => page.evaluate(() => Promise.race([
    (async () => {
      await document.fonts.ready;
      const shown = [...document.images].filter((image) => {
        const box = image.getBoundingClientRect();
        return box.top < window.innerHeight + 200 && box.bottom > -200 && !image.complete;
      });
      await Promise.all(shown.map((image) => image.decode().catch(() => null)));
    })(),
    new Promise((resolve) => { setTimeout(resolve, 6000); }),
  ]));
  // Re-read the boxes at the offset that is about to be captured. Sticky rows,
  // fixed controls and anything that reflows between collection and capture are
  // measured where they actually are, never where the document said they were.
  const liveBoxes = (ids) => page.evaluate((list) => {
    const merge = (runs) => {
      const blocks = [];
      for (const run of runs) {
        const last = blocks[blocks.length - 1];
        if (last && Math.abs(last.x - run.x) <= 1 && Math.abs(last.width - run.width) <= 1 && run.y - (last.y + last.height) <= 2) {
          last.height = run.y + run.height - last.y;
          continue;
        }
        blocks.push({ x: run.x, y: run.y, width: run.width, height: run.height });
      }
      return blocks;
    };
    const bounds = (blocks) => ({
      x: Math.min(...blocks.map((run) => run.x)),
      y: Math.min(...blocks.map((run) => run.y)),
      width: Math.max(...blocks.map((run) => run.x + run.width)) - Math.min(...blocks.map((run) => run.x)),
      height: Math.max(...blocks.map((run) => run.y + run.height)) - Math.min(...blocks.map((run) => run.y)),
    });
    // One pass over the tagged nodes instead of one query per node: an
    // attribute lookup per node re-scans the document, and a long page carries
    // hundreds of them per band.
    const tagged = new Map();
    for (const el of document.querySelectorAll('[data-sweep-node]')) tagged.set(el.getAttribute('data-sweep-node'), el);
    const boxes = {};
    for (const { id, run } of list) {
      const el = tagged.get(String(id));
      if (!el) continue;
      let rect;
      let blocks = null;
      if (run === undefined || run < 0) {
        rect = el.getBoundingClientRect();
      } else {
        // Re-find the same run of glyphs: the element box would take a
        // gradient-clipped sibling's paint back into the sample.
        const node = [...el.childNodes].filter((child) => child.nodeType === 3 && child.textContent.trim())[run];
        if (!node) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const runs = [...range.getClientRects()].filter((each) => each.width >= 1 && each.height >= 1);
        if (!runs.length) continue;
        blocks = merge(runs);
        rect = bounds(blocks);
      }
      if (rect.width < 1 || rect.height < 1) continue;
      boxes[id] = { rect, blocks };
    }
    return boxes;
  }, ids);

  const measureBands = async (list, styleContent) => {
    const rows = [];
    const gradientInk = [];
    // `covered`: chrome was painted over it. `missed`: it was not in the
    // viewport at the offset that was asked for. Both get a second chance.
    const covered = [];
    const missed = [];
    if (!list.length) return { rows, gradientInk, covered, missed };
    const style = await page.addStyleTag({ content: styleContent });
    await page.waitForTimeout(250);
    const shoot = async (requested, group) => {
      await page.evaluate((y) => window.scrollTo(0, y), requested);
      await settleBand();
      await settle();
      // `animations: 'disabled'` fast-forwards finite animations to their final
      // frame. Two things follow from that. A reveal caught mid-fade would
      // sample the composite of half the ink over half the surface, which is
      // neither what the reader sees nor a number that repeats between two runs
      // of the same page. And because the final frame is also a *position* —
      // these reveals slide tens of pixels — the capture has to happen before
      // the boxes are read, or every fast-forwarded node is sampled where it
      // used to be instead of where it landed.
      const shot = (await page.screenshot({ animations: 'disabled' })).toString('base64');
      const boxes = await liveBoxes(group.map((node) => ({ id: node.id, run: node.run })));
      const visible = [];
      for (const node of group) {
        const box = boxes[node.id];
        // A band is chosen from the position the node had when the sweep began.
        // Photographs that land afterwards move the copy, so the band that was
        // supposed to hold it can hold only its top or bottom edge — and a
        // capture is one viewport tall: pixels outside it are not in the shot.
        // Score the pieces the shot contains and re-centre the rest, instead of
        // sampling a neighbouring picture and blaming the ink for it.
        const pieces = box ? ((box.blocks?.length ? box.blocks : [box.rect])
          .filter((piece) => piece.y >= 0 && piece.y + piece.height <= viewport)) : [];
        if (!pieces.length) {
          missed.push({ node, seen: box ? { offset: requested, y: box.rect.y, height: box.rect.height } : null });
          continue;
        }
        // Chrome covers a line, not a paragraph. A paragraph that begins under
        // the header has one line painted on the header's own parchment and the
        // rest on the page, and scoring the box as a whole blames the ink for
        // the header it merely starts behind. Score the lines that stand in the
        // open; a line under chrome is not legible here and is not evidence.
        const open = pieces.filter((piece) => !coverAt(node, piece, GRAZE_SHARE));
        if (!open.length) {
          const whole = pieces.reduce((bounds, piece) => ({
            x: Math.min(bounds.x, piece.x),
            y: Math.min(bounds.y, piece.y),
            right: Math.max(bounds.right, piece.x + piece.width),
            bottom: Math.max(bounds.bottom, piece.y + piece.height),
          }), { x: Infinity, y: Infinity, right: -Infinity, bottom: -Infinity });
          const cover = coverAt(node, { x: whole.x, y: whole.y, width: whole.right - whole.x, height: whole.bottom - whole.y });
          covered.push({
            node,
            by: cover ? `${cover.tag}.${cover.cls}` : 'chrome',
            seen: { offset: requested, y: whole.y, height: whole.bottom - whole.y },
          });
          continue;
        }
        const rect = open.reduce((bounds, piece) => ({
          x: Math.min(bounds.x, piece.x),
          y: Math.min(bounds.y, piece.y),
          right: Math.max(bounds.right, piece.x + piece.width),
          bottom: Math.max(bounds.bottom, piece.y + piece.height),
        }), { x: Infinity, y: Infinity, right: -Infinity, bottom: -Infinity });
        const clipped = { x: rect.x, y: rect.y, width: rect.right - rect.x, height: rect.bottom - rect.y };
        visible.push({ ...node, rect: clipped, blocks: open });
      }
      if (!visible.length) return { rows: [], gradientInk: [] };
      return page.evaluate(MEASURE, { shot, nodes: visible, minimum, minimumLarge, minimumIcon });
    };
    // The last offset is clamped to the final scrollable one, so its window
    // reaches back into the window before it. Score each node once, at the
    // first offset that visits it, or the overlap measures it twice.
    const scored = new Set();
    try {
      for (const offset of offsets) {
        const group = list.filter((node) => {
          if (scored.has(node)) return false;
          const centre = node.rect.y + node.rect.height / 2;
          if (centre < offset || centre >= offset + viewport) return false;
          scored.add(node);
          return true;
        });
        if (!group.length) continue;
        const result = await shoot(offset, group);
        rows.push(...result.rows);
        gradientInk.push(...result.gradientInk);
      }
      // A node can meet the chrome only at the offset its band happens to use:
      // copy that scrolls under the header in one band sits in open water in the
      // next. Re-sample those nodes once, centred in the viewport, so nothing is
      // dropped from the score just because of where the bands fell.
      const retry = new Map();
      for (const entry of [...covered, ...missed]) {
        const target = centerOn(entry.node, entry.seen ?? null);
        const bucket = retry.get(target) ?? [];
        bucket.push(entry.node);
        retry.set(target, bucket);
      }
      for (const [target, group] of retry) {
        const result = await shoot(target, group);
        rows.push(...result.rows);
        gradientInk.push(...result.gradientInk);
      }
    } finally {
      await style.evaluate((node) => node.remove());
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    return { rows, gradientInk, covered, missed };
  };

  // One pass hides the ink and scores ordinary copy, labelled icons and
  // decorative icons together: `HIDE_INK` blanks every glyph and every `svg`
  // alike, so all three read the same surface behind their box and there is no
  // second capture to pay for. Splitting the rows afterwards keeps the two
  // contracts apart — decorative icons are reported, ordinary ink is scored.
  const plain = await measureBands([...nodes.text, ...nodes.icons, ...nodes.decorativeIcons], HIDE_INK);
  // Gradient-clipped ink needs its own pass: the gradient itself has to be
  // dropped so the box shows the surface behind the word, not the word's fill.
  const gradients = await measureBands(nodes.gradient, `${HIDE_INK}\n${HIDE_GRADIENT_INK}`);
  // Reported, never failed: copy that stayed behind floating chrome or out of
  // the viewport at every offset the sweep visited. It is hidden, not painted
  // with low-contrast ink, and scrolling clears it.
  // A node the retry pass rescued at a clear offset is not hidden: it was only
  // hidden at the one offset its band happened to use.
  const scoredIds = new Set([...plain.rows, ...gradients.rows, ...gradients.gradientInk].map((row) => row.id));
  const unresolved = [...plain.covered, ...gradients.covered]
    .filter(({ node }) => !scoredIds.has(node.id))
    .map(({ node, by }) => ({ text: node.text.slice(0, 50), by }));

  const measured = plain.rows.filter((row) => !row.decorative);
  const decorativeIcons = plain.rows.filter((row) => row.decorative);
  const gradientInk = [...gradients.rows, ...gradients.gradientInk];
  return {
    measured,
    offenders: measured.filter((row) => row.ratio < row.minimum).sort((a, b) => a.ratio - b.ratio),
    gradientInk,
    gradientOffenders: gradientInk.filter((row) => row.ratio !== null && row.ratio < row.minimum).sort((a, b) => a.ratio - b.ratio),
    decorativeIcons,
    faintDecorativeIcons: decorativeIcons.filter((row) => row.ratio < row.minimum).sort((a, b) => a.ratio - b.ratio),
    // Reported, never failed.
    occluded: [...nodes.occluded, ...unresolved],
    overlays: nodes.overlays,
  };
}

export function describeGradientOffenders(offenders) {
  return offenders
    .slice(0, 12)
    .map((row) => `${row.ratio} < ${row.minimum} — "${row.text.slice(0, 32)}" gradient stops [${row.ratios.join(', ')}]${row.brightness !== 1 ? ` @ brightness ${row.brightness}` : ''} on painted [${row.background.join(', ')}] :: ${row.className.slice(0, 60)}`)
    .join('\n');
}

export function describeOffenders(offenders) {
  return offenders
    .slice(0, 12)
    .map((row) => `${row.ratio} < ${row.minimum} — "${row.text.slice(0, 32)}" ink ${row.color} on painted [${row.background.join(', ')}] :: ${row.className.slice(0, 60)}`)
    .join('\n');
}
