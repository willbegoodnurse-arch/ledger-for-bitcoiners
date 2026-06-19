import "../../styles/layout.css";
import { useLedger } from "../../state/LedgerContext";

export default function UndoToast() {
  const { pendingUndo, undoLastDelete } = useLedger();
  if (!pendingUndo) return null;
  return (
    <div className="ldg-toast">
      <span>"{pendingUndo.txn.title}" 삭제됨</span>
      <button type="button" onClick={undoLastDelete}>
        되돌리기
      </button>
    </div>
  );
}
