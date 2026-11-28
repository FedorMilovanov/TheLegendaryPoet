/** Pixel bounds for inline presentation only. The gallery keeps the original canvas. */
export type MemoryPreviewFrame = { x: number; y: number; width: number; height: number };

function pixel(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

export function isMemoryPreviewFrame(value: unknown, canvasWidth: number, canvasHeight: number): value is MemoryPreviewFrame {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const { x, y, width, height } = value as Record<string, unknown>;
  return pixel(x) && x >= 0 &&
    pixel(y) && y >= 0 &&
    pixel(width) && width > 0 &&
    pixel(height) && height > 0 &&
    x + width <= canvasWidth && y + height <= canvasHeight;
}
