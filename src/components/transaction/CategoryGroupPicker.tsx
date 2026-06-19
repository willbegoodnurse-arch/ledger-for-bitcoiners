import { useState, type CSSProperties } from "react";
import type { CategoryDef, CategoryGroup, CategoryId } from "../../types";
import { useLedger } from "../../state/LedgerContext";
import { GROUP_LABEL } from "../../lib/categories";
import { ICONS_BY_ID } from "../../lib/categoryIcons";
import { hexToRgba } from "../../lib/colorUtils";

const GROUP_ORDER: CategoryGroup[] = ["expense", "income", "invest"];

function ChipIcon({ iconId }: { iconId: string }) {
  const path = ICONS_BY_ID[iconId]?.path ?? ICONS_BY_ID.dots.path;
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export default function CategoryGroupPicker({
  value,
  onSelect,
}: {
  value: CategoryId;
  onSelect: (category: CategoryDef) => void;
}) {
  const { categories } = useLedger();
  const [expanded, setExpanded] = useState<Record<CategoryGroup, boolean>>({
    expense: true,
    income: false,
    invest: false,
  });

  const byGroup = GROUP_ORDER.map((group) => ({
    group,
    items: categories.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="ldg-cat-groups">
      {byGroup.map(({ group, items }) => {
        const isOpen = expanded[group];
        return (
          <div className="ldg-cat-group" key={group}>
            <button
              type="button"
              className="ldg-cat-group-header"
              onClick={() => setExpanded((e) => ({ ...e, [group]: !e[group] }))}
              aria-expanded={isOpen}
            >
              <span>{GROUP_LABEL[group]}</span>
              <span className="ldg-cat-group-count">{items.length}</span>
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", marginLeft: "auto" }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isOpen && (
              <div className="ldg-cat-grid">
                {items.map((c) => {
                  const active = value === c.id;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      className={`ldg-chip ldg-chip-icon ${active ? "active" : ""}`}
                      style={
                        active
                          ? ({ ["--chip-bg" as string]: hexToRgba(c.fg, 0.18), ["--chip-fg" as string]: c.fg } as CSSProperties)
                          : undefined
                      }
                      onClick={() => onSelect(c)}
                    >
                      <ChipIcon iconId={c.icon} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
