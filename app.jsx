const { useState, useEffect, useRef, useMemo, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "scene": "ledger",
  "intensity": 1.0,
  "size": 0.7,
  "rotation": -10,
  "offsetX": 4,
  "offsetY": -4,
  "tint": "#fff8d4",
  "glow": true,
  "rain": false,
  "autoStrike": true,
  "strikeIntervalSec": 5,
  "boltStyle": "glow"
}/*EDITMODE-END*/;

// =================== Lightning Strike Effect ===================
function LightningStrike({ playKey, intensity, size, rotation, offsetX, offsetY, tint, glow, boltStyle }) {
  return (
    <div className="strike-layer" key={playKey} aria-hidden="true">
      <div className="sky-flash" style={{ "--flash-opacity": 0.5 * intensity }} />
      {glow && (
        <div
          className="bolt-halo"
          style={{
            right: `${offsetX}%`,
            top: `${offsetY}%`,
            transform: `translate(50%, -10%) scale(${size * 1.15}) rotate(${rotation}deg)`,
            "--tint": tint,
            "--halo-opacity": 0.7 * intensity,
          }}
        />
      )}
      <div
        className={`bolt-wrap bolt-${boltStyle}`}
        style={{
          right: `${offsetX}%`,
          top: `${offsetY}%`,
          transform: `translate(50%, -10%) scale(${size}) rotate(${rotation}deg)`,
        }}
      >
        {boltStyle === "original" ? (
          <img src="assets/lightning.png" alt="" className="bolt-img" style={{ "--tint": tint }} draggable="false" />
        ) : boltStyle === "glow" ? (
          <>
            <img src="assets/lightning.png" alt="" className="bolt-img bolt-img-blur" style={{ "--tint": tint }} draggable="false" />
            <img src="assets/lightning.png" alt="" className="bolt-img bolt-img-core" draggable="false" />
          </>
        ) : (
          <img src="assets/lightning.png" alt="" className="bolt-img bolt-img-mono" style={{ "--tint": tint }} draggable="false" />
        )}
      </div>
      <div
        className="impact-glow"
        style={{
          right: `${Math.max(offsetX - 3, 0)}%`,
          "--tint": tint,
          "--impact-opacity": 0.45 * intensity,
        }}
      />
    </div>
  );
}

function Rain({ enabled }) {
  const drops = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 90; i++) {
      arr.push({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 0.45 + Math.random() * 0.4,
        len: 14 + Math.random() * 18,
        op: 0.18 + Math.random() * 0.25,
      });
    }
    return arr;
  }, []);
  if (!enabled) return null;
  return (
    <div className="rain-layer" aria-hidden="true">
      {drops.map((d, i) => (
        <span key={i} className="raindrop"
          style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`, height: `${d.len}px`, opacity: d.op }} />
      ))}
    </div>
  );
}

// =================== Scene: My Ledger (phone) ===================
function LedgerPhoneScene({ children }) {
  return (
    <div className="scene scene-ledger">
      <div className="phone">
        <div className="phone-screen">
          {/* Strike layer covers phone screen */}
          {children}
          {/* Ledger UI rendered via window.MyLedger */}
          <window.MyLedger>{null}</window.MyLedger>
        </div>
        <div className="phone-bezel" />
      </div>
      <div className="floor-glow" />
    </div>
  );
}

// React quirk: window.MyLedger isn't a valid component in JSX directly. Wrap it.
const LedgerInner = () => React.createElement(window.MyLedger, null);

function LedgerPhoneSceneFixed({ children }) {
  return (
    <div className="scene scene-ledger">
      <div className="phone">
        <div className="phone-screen">
          {/* Strike layer sits BEHIND the ledger UI */}
          {children}
          <LedgerInner />
        </div>
        <div className="phone-bezel" />
      </div>
      <div className="floor-glow" />
    </div>
  );
}

// =================== Scene: Asset (transparent) ===================
function AssetScene({ children }) {
  return (
    <div className="scene scene-asset">
      <div className="asset-frame">
        {children}
        <div className="asset-grid" />
      </div>
      <div className="asset-caption">투명 배경 · 9:16 · 우측 상단 내리치기</div>
    </div>
  );
}

// =================== App ===================
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [strikeKey, setStrikeKey] = useState(0);

  useEffect(() => {
    if (!tweaks.autoStrike) return;
    const id = setInterval(() => setStrikeKey((k) => k + 1), Math.max(1.5, tweaks.strikeIntervalSec) * 1000);
    return () => clearInterval(id);
  }, [tweaks.autoStrike, tweaks.strikeIntervalSec]);

  const trigger = useCallback(() => setStrikeKey((k) => k + 1), []);

  useEffect(() => {
    const t = setTimeout(() => setStrikeKey(1), 700);
    return () => clearTimeout(t);
  }, []);

  const strike = (
    <LightningStrike
      playKey={strikeKey}
      intensity={tweaks.intensity}
      size={tweaks.size}
      rotation={tweaks.rotation}
      offsetX={tweaks.offsetX}
      offsetY={tweaks.offsetY}
      tint={tweaks.tint}
      glow={tweaks.glow}
      boltStyle={tweaks.boltStyle}
    />
  );

  let scene;
  if (tweaks.scene === "ledger") {
    scene = <LedgerPhoneSceneFixed>{strike}<Rain enabled={tweaks.rain} /></LedgerPhoneSceneFixed>;
  } else {
    scene = <AssetScene>{strike}</AssetScene>;
  }

  return (
    <div className="root-wrap" onClick={trigger} title="클릭해서 번개 발사">
      {scene}
      <div className="hint">탭하거나 클릭하면 번개가 즉시 내리칩니다 ⚡</div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="장면">
          <TweakRadio
            label="Scene"
            value={tweaks.scene}
            onChange={(v) => setTweak("scene", v)}
            options={[
              { value: "ledger", label: "My Ledger" },
              { value: "asset", label: "투명 에셋" },
            ]}
          />
          <TweakRadio
            label="Bolt 스타일"
            value={tweaks.boltStyle}
            onChange={(v) => setTweak("boltStyle", v)}
            options={[
              { value: "original", label: "원본" },
              { value: "glow", label: "글로우" },
              { value: "mono", label: "단색" },
            ]}
          />
        </TweakSection>

        <TweakSection label="번개">
          <TweakSlider label="크기"     min={0.3} max={1.6} step={0.01} value={tweaks.size}     onChange={(v) => setTweak("size", v)} />
          <TweakSlider label="회전 (°)" min={-30} max={30}  step={1}    value={tweaks.rotation} onChange={(v) => setTweak("rotation", v)} />
          <TweakSlider label="X 오프셋 (%)" min={-10} max={30} step={0.5} value={tweaks.offsetX} onChange={(v) => setTweak("offsetX", v)} />
          <TweakSlider label="Y 오프셋 (%)" min={-20} max={10} step={0.5} value={tweaks.offsetY} onChange={(v) => setTweak("offsetY", v)} />
          <TweakSlider label="강도"     min={0.2} max={1.5} step={0.05} value={tweaks.intensity} onChange={(v) => setTweak("intensity", v)} />
          <TweakColor  label="틴트"     value={tweaks.tint} onChange={(v) => setTweak("tint", v)} />
          <TweakToggle label="글로우 헤일로" value={tweaks.glow} onChange={(v) => setTweak("glow", v)} />
        </TweakSection>

        <TweakSection label="환경">
          <TweakToggle label="비"             value={tweaks.rain}       onChange={(v) => setTweak("rain", v)} />
          <TweakToggle label="자동 발사"       value={tweaks.autoStrike} onChange={(v) => setTweak("autoStrike", v)} />
          <TweakSlider label="발사 주기 (초)"  min={1.5} max={10} step={0.5} value={tweaks.strikeIntervalSec} onChange={(v) => setTweak("strikeIntervalSec", v)} />
          <TweakButton onClick={trigger}>지금 번개 발사 ⚡</TweakButton>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
