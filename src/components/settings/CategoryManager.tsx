import { useState } from "react";
import type { CategoryDef, CategoryGroup } from "../../types";
import { useLedger } from "../../state/LedgerContext";
import { GROUP_LABEL } from "../../lib/categories";
import { ICONS, ICONS_BY_ID } from "../../lib/categoryIcons";
import { hexToRgba } from "../../lib/colorUtils";

const GROUP_ORDER: CategoryGroup[] = ["expense", "income", "invest"];
const ADDABLE_GROUPS: Extract<CategoryGroup, "expense" | "income">[] = ["expense", "income"];

type FormMode = { kind: "add" } | { kind: "edit"; id: string };

function CatSwatch({ c }: { c: CategoryDef }) {
  const path = ICONS_BY_ID[c.icon]?.path ?? ICONS_BY_ID.dots.path;
  return (
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: hexToRgba(c.fg, 0.15),
        color: c.fg,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </span>
  );
}

export default function CategoryManager() {
  const { categories, data, addCategory, updateCategory, deleteCategory } = useLedger();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formFg, setFormFg] = useState("#f87171");
  const [formIcon, setFormIcon] = useState("dots");
  const [formGroup, setFormGroup] = useState<"expense" | "income">("expense");

  const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const openAdd = () => {
    setFormMode({ kind: "add" });
    setFormLabel("");
    setFormFg("#f87171");
    setFormIcon("dots");
    setFormGroup("expense");
  };

  const openEdit = (c: CategoryDef) => {
    setFormMode({ kind: "edit", id: c.id });
    setFormLabel(c.label);
    setFormFg(c.fg);
    setFormIcon(c.icon);
  };

  const closeForm = () => setFormMode(null);

  const handleSave = () => {
    const label = formLabel.trim();
    if (!label) return;
    if (formMode?.kind === "add") {
      addCategory({ label, fg: formFg, icon: formIcon, group: formGroup });
    } else if (formMode?.kind === "edit") {
      updateCategory(formMode.id, { label, fg: formFg, icon: formIcon });
    }
    closeForm();
  };

  const handleDelete = (c: CategoryDef) => {
    const linkedCount = data.txns.filter((t) => t.cat === c.id).length;
    if (linkedCount > 0) {
      const fallbackId = c.group === "income" ? "etc_income" : "etc";
      const fallbackLabel = categoriesById[fallbackId]?.label ?? "기타";
      const ok = window.confirm(
        `"${c.label}" 카테고리에 연결된 거래가 ${linkedCount}건 있어요.\n삭제하면 모두 "${fallbackLabel}"(으)로 이동합니다. 계속할까요?`
      );
      if (!ok) return;
    }
    deleteCategory(c.id);
    if (formMode?.kind === "edit" && formMode.id === c.id) closeForm();
  };

  return (
    <div className="ldg-card">
      <div className="ldg-card-head">
        <div className="ldg-label">카테고리 관리</div>
        {formMode === null && (
          <button type="button" className="ldg-link" onClick={openAdd}>
            + 새 카테고리
          </button>
        )}
      </div>

      {formMode && (
        <div className="ldg-cat-form">
          {formMode.kind === "add" && (
            <div className="ldg-field">
              <div className="ldg-label">그룹</div>
              <div className="ldg-radio-group">
                {ADDABLE_GROUPS.map((g) => (
                  <button type="button" key={g} className={formGroup === g ? "on" : ""} onClick={() => setFormGroup(g)}>
                    {GROUP_LABEL[g]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="ldg-field">
            <div className="ldg-label">이름</div>
            <input className="ldg-input" value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="카테고리 이름" />
          </div>
          <div className="ldg-field">
            <div className="ldg-label">색상</div>
            <div className="ldg-color-row">
              <input type="color" value={formFg} onChange={(e) => setFormFg(e.target.value)} className="ldg-color-input" />
              <span className="ldg-tiny mono" style={{ fontFamily: "var(--ldg-mono)" }}>
                {formFg}
              </span>
            </div>
          </div>
          <div className="ldg-field">
            <div className="ldg-label">아이콘</div>
            <div className="ldg-icon-picker-grid">
              {ICONS.map((icon) => (
                <button
                  type="button"
                  key={icon.id}
                  className={`ldg-icon-picker-btn ${formIcon === icon.id ? "selected" : ""}`}
                  style={{ color: formFg, background: hexToRgba(formFg, formIcon === icon.id ? 0.22 : 0.08) }}
                  onClick={() => setFormIcon(icon.id)}
                  title={icon.label}
                  aria-label={icon.label}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={icon.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div className="ldg-cat-form-actions">
            <button type="button" className="ldg-link" onClick={closeForm}>
              취소
            </button>
            <button type="button" className="ldg-submit-btn" style={{ width: "auto", padding: "10px 20px" }} onClick={handleSave}>
              저장
            </button>
          </div>
        </div>
      )}

      {GROUP_ORDER.map((group) => {
        const items = categories.filter((c) => c.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="ldg-cat-manage-section">
            <div className="ldg-tiny" style={{ margin: "14px 0 6px" }}>
              {GROUP_LABEL[group].toUpperCase()} · {items.length}
            </div>
            <div className="ldg-cat-list">
              {items.map((c) => (
                <div className="ldg-cat-row" key={c.id}>
                  <CatSwatch c={c} />
                  <span style={{ fontSize: 13, flex: 1, minWidth: 0 }}>{c.label}</span>
                  <div className="ldg-cat-manage-actions">
                    <button type="button" className="ldg-icon-action" onClick={() => openEdit(c)} aria-label="편집">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                      </svg>
                    </button>
                    {c.protected ? (
                      <span className="ldg-tiny" style={{ padding: "0 4px" }}>
                        기본
                      </span>
                    ) : (
                      <button type="button" className="ldg-icon-action danger" onClick={() => handleDelete(c)} aria-label="삭제">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 7h16 M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
