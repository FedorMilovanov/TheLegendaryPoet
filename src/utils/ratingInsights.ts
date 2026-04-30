export interface RatedDimension {
  key: string;
  label: string;
  value: number;
}

export function getRatedDimensions(
  values: Record<string, number>,
  dimensions: Array<{ key: string; label: string }>,
) {
  return dimensions
    .map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      value: values[dimension.key] || 0,
    }))
    .filter((dimension) => dimension.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function getStrongestDimension(items: RatedDimension[]) {
  return items[0];
}

export function getWeakestDimension(items: RatedDimension[]) {
  return items.length ? items[items.length - 1] : undefined;
}

export function getTopDimensionLabels(items: RatedDimension[], limit = 3) {
  return items.slice(0, limit).map((item) => item.label);
}
