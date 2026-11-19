/** Small deterministic fingerprint of published text; not a security token. */
export function passageStamp(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; ++i) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}
