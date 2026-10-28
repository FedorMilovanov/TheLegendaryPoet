import { expect } from '@playwright/test';

export async function contrastMeasurements(locator, directTextOnly = false) {
  return locator.evaluateAll((nodes, directTextOnly) => {
    const parse = (value) => {
      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match) {
        // Tailwind may serialize computed colors as oklch()/color(). Let the
        // browser convert those to sRGB instead of silently treating them as black.
        if (!CSS.supports('color', value)) throw new Error(`Unsupported computed color: ${value}`);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d');
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      }
      const parts = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 };
    };
    const composite = (front, back) => {
      const alpha = front.a + back.a * (1 - front.a);
      if (alpha <= 0) return { r: 255, g: 255, b: 255, a: 1 };
      return {
        r: (front.r * front.a + back.r * back.a * (1 - front.a)) / alpha,
        g: (front.g * front.a + back.g * back.a * (1 - front.a)) / alpha,
        b: (front.b * front.a + back.b * back.a * (1 - front.a)) / alpha,
        a: alpha,
      };
    };
    const luminance = ({ r, g, b }) => {
      const channel = (raw) => {
        const c = raw / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    return nodes.filter((node) => !directTextOnly || (node instanceof HTMLElement
      && [...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim()))).map((node) => {
      let background = { r: 255, g: 255, b: 255, a: 1 };
      const chain = [];
      for (let current = node; current instanceof Element; current = current.parentElement) chain.push(current);
      for (const current of chain.reverse()) {
        const bg = parse(getComputedStyle(current).backgroundColor);
        if (bg.a > 0) background = composite(bg, background);
      }

      const foreground = composite(parse(getComputedStyle(node).color), background);
      const l1 = luminance(foreground);
      const l2 = luminance(background);
      return { text: node.textContent, ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) };
    });
  }, directTextOnly);
}

export async function contrastRatio(locator) {
  await locator.waitFor({ state: 'attached' });
  const measurements = await contrastMeasurements(locator);
  expect(measurements).toHaveLength(1);
  return measurements[0].ratio;
}


