import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

const ACTION_WIDTH = 76; // 살짝 스와이프해서 고정될 때 콘텐츠가 밀리는 거리(버튼 탭 영역)
// 액션 배경 폭(.swipe-row-action의 width, CSS에서 132px로 정의)은 COMMIT_THRESHOLD까지
// 끌어도 빈틈이 안 보이게 ACTION_WIDTH보다 넉넉히 잡는다.
const REVEAL_THRESHOLD = 36;
const COMMIT_THRESHOLD = 120; // 이 거리 이상 끌면 놓기 전에 즉시 실행
const MAX_DRAG = COMMIT_THRESHOLD;
const TAP_CLOSE_THRESHOLD = 6;

export default function SwipeableRow({
  children,
  onEdit,
  onDelete,
}: {
  children: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const offsetRef = useRef(0);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const triggeredRef = useRef(false);
  // dragging은 CSS transition on/off용 state일 뿐, 제스처 판정 자체는 ref로 한다 —
  // 포인터 이벤트가 같은 배치 안에서 연달아 들어오면 setState가 아직 커밋되기 전이라
  // state를 읽으면 한 박자 늦은 값을 보게 된다.
  const draggingRef = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [menuOpen]);

  const setOffsetBoth = (v: number) => {
    offsetRef.current = v;
    setOffset(v);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return; // 버튼 클릭은 제스처로 가로채지 않음
    startXRef.current = e.clientX;
    startOffsetRef.current = offsetRef.current;
    triggeredRef.current = false;
    draggingRef.current = true;
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 일부 환경(합성 포인터 이벤트 등)에서는 capture가 불가할 수 있음 — 무시해도 제스처 자체엔 지장 없음
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || triggeredRef.current) return;
    const delta = e.clientX - startXRef.current;
    const next = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, startOffsetRef.current + delta));
    setOffsetBoth(next);
    if (next <= -COMMIT_THRESHOLD) {
      triggeredRef.current = true;
      draggingRef.current = false;
      setDragging(false);
      setOffsetBoth(0);
      onDelete();
    } else if (next >= COMMIT_THRESHOLD) {
      triggeredRef.current = true;
      draggingRef.current = false;
      setDragging(false);
      setOffsetBoth(0);
      onEdit();
    }
  };

  const settle = () => {
    if (triggeredRef.current) return;
    const dragDistance = Math.abs(offsetRef.current - startOffsetRef.current);
    if (startOffsetRef.current !== 0 && dragDistance < TAP_CLOSE_THRESHOLD) {
      setOffsetBoth(0); // 이미 열려있는 행을 살짝 탭하면 닫는다
      return;
    }
    const v = offsetRef.current;
    if (v <= -REVEAL_THRESHOLD) setOffsetBoth(-ACTION_WIDTH);
    else if (v >= REVEAL_THRESHOLD) setOffsetBoth(ACTION_WIDTH);
    else setOffsetBoth(0);
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
    setDragging(false);
    settle();
  };

  return (
    <div className={`swipe-row ${menuOpen ? "menu-open" : ""} ${offset !== 0 || dragging ? "swiping" : ""}`}>
      <button type="button" className="swipe-row-action swipe-row-action-edit" onClick={onEdit}>
        <span>수정</span>
      </button>
      <button type="button" className="swipe-row-action swipe-row-action-delete" onClick={onDelete}>
        <span>삭제</span>
      </button>
      <div
        className={`ldg-txn swipe-row-content ${dragging ? "dragging" : ""}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children}
        <button
          type="button"
          className="ldg-txn-menu-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="더보기"
        >
          ⋯
        </button>
        {menuOpen && (
          <div className="ldg-txn-menu" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
