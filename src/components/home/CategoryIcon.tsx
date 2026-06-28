import type { CategoryId } from "../../types";
import { useLedger } from "../../state/LedgerContext";
import { ICONS_BY_ID } from "../../lib/categoryIcons";
import { hexToRgba } from "../../lib/colorUtils";

export default function CategoryIcon({ cat }: { cat: CategoryId }) {
  const { categoriesById } = useLedger();
  const c = categoriesById[cat] ?? categoriesById.etc;
  const iconPath = ICONS_BY_ID[c?.icon ?? "dots"]?.path ?? ICONS_BY_ID.dots.path;
  return (
    <div className="ldg-cat-icon" style={{ background: hexToRgba(c.fg, 0.1), color: c.fg }}>
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={iconPath} />
      </svg>
    </div>
  );
}
