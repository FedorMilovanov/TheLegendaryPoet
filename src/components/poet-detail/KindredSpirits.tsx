import { Link } from '../ui/Link';
import { poets } from '../../data/poets';
import { poetConnections, type PoetConnection } from '../../data/poetConnections';
import { EPOCH_COLORS, EPOCH_LABELS } from '../../data/epochColors';
import { getPoetEpoch } from '../../utils/poetMeta';
import { Poet } from '../../types/poet';

const CONN_STYLE: Record<PoetConnection['type'], { label: string; color: string }> = {
  influence: { label: 'Влияние', color: '#63d8ff' },
  personal: { label: 'Личная связь', color: '#d4af37' },
  epoch: { label: 'Одна эпоха', color: '#e2e8f0' },
  thematic: { label: 'Тема', color: '#a78bfa' },
  rivalry: { label: 'Полемика', color: '#ef4444' },
};

/**
 * "Родственные души" — surfaces the poet-connections graph on the detail page:
 * the poet's epoch badge plus every other poet they are linked to (influence,
 * personal ties, rivalry, shared epoch or theme) with a short note.
 */
export default function KindredSpirits({ poet }: { poet: Poet }) {
  const epoch = getPoetEpoch(poet);
  const epochColor = EPOCH_COLORS[epoch] || '#d4af37';
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
    <div className="rounded-3xl border border-cyan-400/10 bg-[#061018]/65 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Родственные души</h3>
        {epochLabel && (
          <span
            className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: epochColor, borderColor: `${epochColor}40`, backgroundColor: `${epochColor}12` }}
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
                className="block rounded-2xl border border-white/5 bg-black/20 px-4 py-3 transition hover:border-cyan-400/25 hover:bg-cyan-400/5"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-white">{other.name}</span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: style.color, backgroundColor: `${style.color}18` }}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-cyan-100/45">{conn.note}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] leading-relaxed text-cyan-100/40">
          Отдельная поэтическая судьба — прямых связей в нашей карте пока нет.
        </p>
      )}
    </div>
  );
}
