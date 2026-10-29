import { Link } from '../ui/Link';
import { poets } from '../../data/poets';
import { poetConnections, type PoetConnection } from '../../data/poetConnections';
import { EPOCH_COLORS, EPOCH_LABELS, epochTint } from '../../data/epochColors';
import { getPoetEpoch } from '../../utils/poetMeta';
import { Poet } from '../../types/poet';

// Theme tokens, never literals: see the note in src/data/epochColors.ts.
const CONN_STYLE: Record<PoetConnection['type'], { label: string; color: string }> = {
  influence: { label: 'Влияние', color: 'var(--conn-influence)' },
  personal: { label: 'Личная связь', color: 'var(--conn-personal)' },
  epoch: { label: 'Одна эпоха', color: 'var(--conn-epoch)' },
  thematic: { label: 'Тема', color: 'var(--conn-thematic)' },
  rivalry: { label: 'Полемика', color: 'var(--conn-rivalry)' },
};

/**
 * "Родственные души" — surfaces the poet-connections graph on the detail page:
 * the poet's epoch badge plus every other poet they are linked to (influence,
 * personal ties, rivalry, shared epoch or theme) with a short note.
 */
export default function KindredSpirits({ poet }: { poet: Poet }) {
  const epoch = getPoetEpoch(poet);
  const epochColor = EPOCH_COLORS[epoch] || 'var(--epoch-golden)';
  const epochLabel = poet.epochLabel || EPOCH_LABELS[epoch] || '';

  const links = poetConnections
    .filter((c) => c.source === poet.id || c.target === poet.id)
    .map((c) => {
      const otherId = c.source === poet.id ? c.target : c.source;
      const other = poets.find((p) => p.id === otherId);
      return other ? { conn: c, other } : null;
    })
    .filter((x): x is { conn: PoetConnection; other: Poet } => x !== null);

  if (!links.length && !epochLabel) return null;

  return (
    <div className="theme-soft-surface rounded-3xl border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Родственные души</h3>
        {epochLabel && (
          <span
            className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: epochColor, borderColor: epochTint(epochColor, 25), backgroundColor: epochTint(epochColor, 7) }}
          >
            {epochLabel}
          </span>
        )}
      </div>

      {links.length > 0 ? (
        <div className="space-y-2">
          {links.map(({ conn, other }) => {
            const style = CONN_STYLE[conn.type];
            return (
              <Link
                key={`${conn.source}-${conn.target}-${conn.label}`}
                to={`/poets/${other.id}`}
                className="theme-elevated-surface block rounded-2xl border px-4 py-3 transition hover:border-cyan-400/25"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="theme-text truncate text-sm font-bold">{other.name}</span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: style.color, backgroundColor: epochTint(style.color, 9) }}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="theme-functional-muted line-clamp-2 text-[11px] leading-relaxed">{conn.note}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="theme-functional-muted text-[11px] leading-relaxed">
          Отдельная поэтическая судьба — прямых связей в нашей карте пока нет.
        </p>
      )}
    </div>
  );
}
