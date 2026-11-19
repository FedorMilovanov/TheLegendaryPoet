/** Non-blocking route content is still readable. A fragment or reading
 * bookmark below it, however, cannot be measured against the excerpt. */
export default function ReaderLayoutPending() {
  return <span hidden data-reader-layout-pending="" />;
}
