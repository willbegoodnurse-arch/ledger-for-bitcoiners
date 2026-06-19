import type { ReactNode } from "react";
import "../../styles/layout.css";

export default function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <div className="app-frame">{children}</div>
    </div>
  );
}
