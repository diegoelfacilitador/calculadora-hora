import { useState, useMemo } from "react";

const fmt = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);

const C = {
  bg: "#0f0f0f", card: "#1a1a1a", border: "#2a2a2a",
  text: "#f5f5f5", muted: "#888", faint: "#444",
  green: "#4ade80", yellow: "#facc15", red: "#f87171",
};

const css = {
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2 },
  h2: { fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 20px" },
};

const health = (visible, real) => {
  if (real === 0) return null;
  const r = visible / real;
  if (r >= 1.2) return { color: C.green, label: "Precio sano" };
  if (r >= 0.9) return { color: C.yellow, label: "En el límite" };
  return { color: C.red, label: "Precio bajo costo" };
};

const WeekBar = ({ ocupacion }) => {
  const prep = Math.round((100 - ocupacion) * 0.4);
  const admin = Math.round((100 - ocupacion) * 0.35);
  const imp = 100 - ocupacion - prep - admin;
  const blocks = [
    { label: "Cobrable", pct: ocupacion, color: C.green },
    { label: "Preparación", pct: prep, color: "#60a5fa" },
    { label: "Venta/Admin", pct: admin, color: C.yellow },
    { label: "Imprevistos", pct: imp, color: C.faint },
  ];
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", gap: 2 }}>
        {blocks.map((b, i) => (
          <div key={i} style={{ width: `${b.pct}%`, background: b.color, transition: "width 0.3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 10 }}>
        {blocks.map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: b.color, display: "inline-block" }} />
            {b.label} <span style={{ color: C.text, fontWeight: 700 }}>{b.pct}%</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 1.6, borderLeft: `2px solid ${C.border}`, paddingLeft: 12 }}>
        Como un hotel que no espera ocupar el 100% de sus habitaciones cada noche — tú tampoco puedes vender el 100% de tus horas. El precio debe sostenerse con las que realmente vendes.
      </p>
    </div>
  );
};

const Slider = ({ label, value, min, max, step, onChange, suffix = "", note }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
      <span style={css.label}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{value}{suffix}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: C.text, cursor: "pointer" }} />
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.faint, marginTop: 3 }}>
      <span>{min}{suffix}</span><span>{max}{suffix}</span>
    </div>
    {note && <p style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>{note}</p>}
  </div>
);

const ScenarioCard = ({ label, horas_dia, dias, ocupacion, bruto, highlight }) => {
  const horasTotales = horas_dia * dias;
  const horasVendibles = Math.round(horasTotales * ocupacion / 100);
  const valorHora = horasVendibles > 0 ? Math.ceil(bruto / horasVendibles / 1000) * 1000 : 0;
  const ocupReq = horasTotales > 0 ? Math.round((bruto / valorHora) / horasTotales * 100) : 0;
  const viable = ocupReq <= 85;
  return (
    <div style={{
      flex: 1, minWidth: 150, borderRadius: 12, padding: 20,
      background: highlight ? C.text : C.card,
      border: `1px solid ${highlight ? C.text : C.border}`,
      color: highlight ? "#0f0f0f" : C.text,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, opacity: 0.5, marginBottom: 14 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{fmt(valorHora)}</div>
      <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 16, marginTop: 4 }}>por hora</div>
      <div style={{ fontSize: 12, lineHeight: 2, opacity: 0.75 }}>
        <div>{horas_dia}h/día · {dias} días/mes</div>
        <div>Horas vendibles: <strong>{horasVendibles}h</strong></div>
        <div>Ocupación requerida: <strong>{ocupReq}%</strong></div>
      </div>
      <div style={{
        marginTop: 14, padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
        background: viable
          ? (highlight ? "rgba(0,0,0,0.08)" : "rgba(74,222,128,0.1)")
          : "rgba(248,113,113,0.15)",
        color: viable ? (highlight ? "#166534" : C.green) : C.red,
      }}>
        {viable ? `✓ Alcanzable (${ocupReq}% ocupación)` : `⚠ Exige ${ocupReq}% ocupación`}
      </div>
    </div>
  );
};

const ServiceRow = ({ s, valorHora, onChange, onRemove }) => {
  const precioVisible = valorHora * s.horas;
  const precioReal = valorHora * s.horasReales;
  const h = health(precioVisible, precioReal);
  return (
    <div style={{ padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <input value={s.nombre} onChange={e => onChange({ ...s, nombre: e.target.value })}
          style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 13, color: C.text, outline: "none" }} />
        <button onClick={onRemove}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, fontSize: 20, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Horas que cobra el cliente</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="number" min={0.5} max={40} step={0.5} value={s.horas}
              onChange={e => onChange({ ...s, horas: Number(e.target.value) })}
              style={{ width: 60, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 13, color: C.text, textAlign: "center", outline: "none" }} />
            <span style={{ fontSize: 12, color: C.muted }}>hrs</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, marginLeft: 8 }}>{fmt(precioVisible)}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Horas que realmente inviertes</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="number" min={0.5} max={80} step={0.5} value={s.horasReales}
              onChange={e => onChange({ ...s, horasReales: Number(e.target.value) })}
              style={{ width: 60, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 13, color: C.text, textAlign: "center", outline: "none" }} />
            <span style={{ fontSize: 12, color: C.muted }}>hrs</span>
            <span style={{ fontSize: 13, color: C.muted, marginLeft: 8 }}>{fmt(precioReal)}</span>
          </div>
        </div>
        {h && (
          <div style={{ fontSize: 12, fontWeight: 600, color: h.color, whiteSpace: "nowrap" }}>
            ● {h.label}
          </div>
        )}
      </div>
      {s.horasReales > 0 && s.horas > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 6, borderRadius: 4, background: C.border, overflow: "hidden", position: "relative" }}>
            <div style={{
              position: "absolute", left: 0, top: 0, height: "100%",
              width: `${Math.min(100, (s.horas / s.horasReales) * 100)}%`,
              background: h?.color ?? C.green, borderRadius: 4,
            }} />
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
            Cobras {s.horas}h de {s.horasReales}h invertidas — recuperas el {Math.round((s.horas / s.horasReales) * 100)}% del tiempo real
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [meta, setMeta] = useState(5000000);
  const [retencion, setRetencion] = useState(13.75);
  const [horasDia, setHorasDia] = useState(4);
  const [diasMes, setDiasMes] = useState(20);
  const [ocupacion, setOcupacion] = useState(60);
  const [services, setServices] = useState([
    { id: 1, nombre: "Taller de medio día", horas: 4, horasReales: 7 },
    { id: 2, nombre: "Día de consultoría", horas: 8, horasReales: 11 },
    { id: 3, nombre: "Workshop completo (2 días)", horas: 16, horasReales: 24 },
  ]);
  const [nextId, setNextId] = useState(4);

  const bruto = useMemo(() => meta / (1 - retencion / 100), [meta, retencion]);
  const horasTotales = horasDia * diasMes;
  const horasVendibles = Math.round(horasTotales * ocupacion / 100);
  const valorHora = horasVendibles > 0 ? Math.ceil(bruto / horasVendibles / 1000) * 1000 : 0;
  const ocupReq = horasTotales > 0 ? Math.round((bruto / valorHora) / horasTotales * 100) : 0;
  const viable = ocupReq <= 85;

  const steps = [
    { label: "Meta líquida", val: fmt(meta), note: "Lo que quieres recibir" },
    { label: "Bruto a emitir", val: fmt(Math.round(bruto)), note: `Retención ${retencion}%` },
    { label: "Horas totales/mes", val: `${horasTotales}h`, note: `${horasDia}h × ${diasMes} días` },
    { label: "Horas vendibles", val: `${horasVendibles}h`, note: `${ocupacion}% cobrable` },
    { label: "Valor hora", val: fmt(valorHora), note: "Redondeado al millar", highlight: true },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: C.bg, minHeight: "100vh", padding: "32px 16px", color: C.text }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>Calculadora freelance</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, margin: "0 0 8px", lineHeight: 1.1 }}>¿Cuánto vale tu hora?</h1>
          <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>Un valor hora realista, basado en lo que quieres ganar y las horas que realmente puedes vender.</p>
        </div>

        {/* 01 Meta */}
        <div style={css.card}>
          <h2 style={css.h2}>01 · Tu meta</h2>
          <Slider label="Ingreso líquido mensual" value={meta} min={500000} max={20000000} step={100000}
            onChange={setMeta} suffix=" CLP"
            note={`Necesitas emitir ${fmt(Math.round(bruto))} en bruto con retención ${retencion}%.`} />
          <Slider label="Retención boleta de honorarios" value={retencion} min={10} max={25} step={0.25}
            onChange={setRetencion} suffix="%" />
        </div>

        {/* 02 Tiempo */}
        <div style={css.card}>
          <h2 style={css.h2}>02 · Tu tiempo real</h2>
          <Slider label="Horas de trabajo al día" value={horasDia} min={1} max={10} step={0.5}
            onChange={setHorasDia} suffix="h"
            note="Solo las horas que podrías dedicar a trabajo cobrable, no las que estás despierto." />
          <Slider label="Días trabajables al mes" value={diasMes} min={10} max={22} step={1}
            onChange={setDiasMes} suffix=" días"
            note="Días hábiles reales, descontando feriados y días propios." />
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={css.label}>¿Qué % de tus horas puedes cobrar?</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{ocupacion}%</span>
            </div>
            <input type="range" min={30} max={90} step={5} value={ocupacion}
              onChange={e => setOcupacion(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.text, cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.faint, marginTop: 3, marginBottom: 8 }}>
              <span>30%</span><span>90%</span>
            </div>
            <WeekBar ocupacion={ocupacion} />
          </div>
        </div>

        {/* 03 Cálculo */}
        <div style={css.card}>
          <h2 style={css.h2}>03 · El cálculo paso a paso</h2>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: i < steps.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: s.highlight ? C.text : C.border, color: s.highlight ? C.bg : C.muted, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 14, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{s.note}</div>
              </div>
              <div style={{ fontSize: s.highlight ? 22 : 16, fontWeight: s.highlight ? 800 : 600, color: s.highlight ? C.text : C.muted }}>{s.val}</div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: viable ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)", color: viable ? C.green : C.red, fontSize: 13, fontWeight: 600 }}>
            {viable ? `✓ Meta alcanzable vendiendo el ${ocupReq}% de tus horas.` : `⚠ Necesitas vender el ${ocupReq}% de tus horas. Sube el valor hora o revisa la meta.`}
          </div>
        </div>

        {/* Escenarios */}
        <div style={css.card}>
          <h2 style={css.h2}>Escenarios comparados</h2>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px" }}>Para {fmt(meta)} líquidos · Retención {retencion}% · Ocupación {ocupacion}%</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <ScenarioCard label="Jornada completa" horas_dia={8} dias={20} ocupacion={ocupacion} bruto={bruto} />
            <ScenarioCard label="Media jornada" horas_dia={4} dias={20} ocupacion={ocupacion} bruto={bruto} highlight />
            <ScenarioCard label="Cuarto de jornada" horas_dia={2} dias={20} ocupacion={ocupacion} bruto={bruto} />
          </div>
        </div>

        {/* Tarifario */}
        <div style={css.card}>
          <h2 style={css.h2}>04 · Tarifario real</h2>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 4px" }}>Valor hora: <strong style={{ color: C.text }}>{fmt(valorHora)}</strong> · Ingresa las horas que cobra el cliente y las que realmente inviertes.</p>
          <p style={{ fontSize: 11, color: C.faint, margin: "0 0 16px", lineHeight: 1.5 }}>Un taller de 4 horas no cuesta 4h — incluye preparación, coordinación y seguimiento.</p>
          {services.map(s => (
            <ServiceRow key={s.id} s={s} valorHora={valorHora}
              onChange={updated => setServices(services.map(x => x.id === s.id ? updated : x))}
              onRemove={() => setServices(services.filter(x => x.id !== s.id))} />
          ))}
          <button
            onClick={() => { setServices([...services, { id: nextId, nombre: "Nuevo servicio", horas: 4, horasReales: 6 }]); setNextId(nextId + 1); }}
            style={{ marginTop: 16, width: "100%", padding: 10, border: `1px dashed ${C.border}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 13, color: C.muted, fontWeight: 500 }}>
            + Agregar servicio
          </button>
        </div>

        <p style={{ fontSize: 11, color: C.faint, textAlign: "center", marginTop: 8 }}>
          Orientativo. Los valores reales dependen de tu mercado, especialidad y propuesta de valor.
        </p>
      </div>
    </div>
  );
}