/** Pixel bounds for inline presentation only. The gallery keeps the original canvas. */
export type MemoryPreviewFrame = { x: number; y: number; width: number; height: number };

export function isMemoryPreviewFrame(value: unknown, canvasWidth: number, canvasHeight: number): value is MemoryPreviewFrame {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const { x, y, width, height } = value as Record<string, unknown>;
  return typeof x === 'number' && Number.isSafeInteger(x) && x >= 0 &&
    typeof y === 'number' && Number.isSafeInteger(y) && y >= 0 &&
    typeof width === 'number' && Number.isSafeInteger(width) && width > 0 &&
    typeof height === 'number' && Number.isSafeInteger(height) && height > 0 &&
    x + width <= canvasWidth && y + height <= canvasHeight;
}
