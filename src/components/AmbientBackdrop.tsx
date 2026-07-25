import './ambientBackdrop.css';

/**
 * Static atmospheric depth for the persistent app shell.
 *
 * Radial gradients provide the same soft gold/cyan field without the previous
 * 700px blur filters, will-change layers and three infinite animations that
 * kept the compositor active on every route for the whole session.
 */
export default function AmbientBackdrop() {
  return (
    <div data-ambient-backdrop className="ambient-backdrop" aria-hidden="true">
      <span data-ambient-field="gold" className="ambient-field ambient-field-gold" />
      <span data-ambient-field="cyan" className="ambient-field ambient-field-cyan" />
      <span data-ambient-field="blue" className="ambient-field ambient-field-blue" />
    </div>
  );
}
