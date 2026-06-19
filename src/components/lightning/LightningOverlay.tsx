import { useEffect, useState } from "react";
import "../../styles/lightning.css";

const INTENSITY = 1.0;
const SIZE = 0.82;
const ROTATION = -10;
const OFFSET_X = 1;
const OFFSET_Y = -3;
const TINT = "#fff8d4";
const STRIKE_INTERVAL_MS = 3500;

// 우측 상단에서 자동으로 반복되는 번개 멀티플래시 연출.
// z-index 0(최하단)에 위치해 본문 텍스트를 가리지 않는다.
export default function LightningOverlay() {
  const [strikeKey, setStrikeKey] = useState(0);

  useEffect(() => {
    const initial = setTimeout(() => setStrikeKey(1), 300);
    return () => clearTimeout(initial);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setStrikeKey((k) => k + 1), STRIKE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="strike-layer" key={strikeKey} aria-hidden="true">
      <div className="sky-flash" style={{ ["--flash-opacity" as string]: 0.5 * INTENSITY }} />
      <div
        className="bolt-halo"
        style={{
          right: `${OFFSET_X}%`,
          top: `${OFFSET_Y}%`,
          transform: `translate(50%, -10%) scale(${SIZE * 1.15}) rotate(${ROTATION}deg)`,
          ["--tint" as string]: TINT,
          ["--halo-opacity" as string]: 0.7 * INTENSITY,
        }}
      />
      <div
        className="bolt-wrap bolt-glow"
        style={{
          right: `${OFFSET_X}%`,
          top: `${OFFSET_Y}%`,
          transform: `translate(50%, -10%) scale(${SIZE}) rotate(${ROTATION}deg)`,
        }}
      >
        <img
          src="/lightning.png"
          alt=""
          className="bolt-img bolt-img-blur"
          style={{ ["--tint" as string]: TINT }}
          draggable="false"
        />
        <img src="/lightning.png" alt="" className="bolt-img bolt-img-core" draggable="false" />
      </div>
      <div
        className="impact-glow"
        style={{
          right: `${Math.max(OFFSET_X - 3, 0)}%`,
          ["--tint" as string]: TINT,
          ["--impact-opacity" as string]: 0.45 * INTENSITY,
        }}
      />
    </div>
  );
}
