import { useState, useMemo } from "react";

const UF_DEFAULT = 38500;
const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
const fmtUF = (n) => n.toFixed(1) + " UF";

const C = {
  bg: "#0f0f0f", card: "#1a1a1a", border: "#2a2a2a",
  text: "#f5f5f5", muted: "#888", faint: "#222",
  green: "#4ade80", yellow: "#facc15", red: "#f87171", blue: "#60a5fa",
};

const Tag = ({ label, color }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: color + "22", color, letterSpacing: 0.5 }}>{label}</span>
);

const TRASLADO_CATS = ["Pasaje aéreo", "Arriendo vehículo", "Bencina / depreciación", "Viáticos (alojamiento)", "Viáticos (alimentación)", "Otros"];

const ROLES_DEFAULT = [
  { id: 1, nombre: "Director de proyecto", terreno: 5, backoffice: 4 },
  { id: 2, nombre: "Facilitador Senior", terreno: 4, backoffice: 3.5 },
  { id: 3, nombre: "Facilitador Junior", terreno: 2.5, backoffice: 2 },
];

const FASES_INIT = [
  {
    id: 1, nombre: "Workshop estratégico con liderazgo", modalidad: "Presencial", tipo: "Ejecución",
    descripcion: "Sesión de 2h con gerencia, subgerencia y líderes zonales. Traduce metas estratégicas en esfuerzos concretos.",
    asignaciones: [{ rolId: 1, hTerreno: 4, hBackoffice: 2 }, { rolId: 2, hTerreno: 3, hBackoffice: 1 }],
    traslados: [{ cat: "Pasaje aéreo", uf: 0 }, { cat: "Viáticos (alojamiento)", uf: 1 }],
    materiales: [{ desc: "Impresión de materiales", uf: 0.5 }, { desc: "Papelería y post-its", uf: 0.3 }],
  },
  {
    id: 2, nombre: "3 Workshops territoriales", modalidad: "Presencial", tipo: "Ejecución",
    descripcion: "3 sesiones de 4h en norte-norte, norte-centro y sur. Levantamiento de iniciativas priorizadas.",
    asignaciones: [{ rolId: 1, hTerreno: 12, hBackoffice: 6 }, { rolId: 2, hTerreno: 12, hBackoffice: 3 }],
    traslados: [{ cat: "Pasaje aéreo", uf: 4 }, { cat: "Viáticos (alojamiento)", uf: 3 }, { cat: "Viáticos (alimentación)", uf: 2 }],
    materiales: [{ desc: "Impresión de materiales (x3)", uf: 1.2 }, { desc: "Papelería y post-its (x3)", uf: 0.9 }, { desc: "Arriendo sala (x3)", uf: 0 }],
  },
  {
    id: 3, nombre: "Calibración interna — síntesis", modalidad: "Remoto", tipo: "Gabinete",
    descripcion: "Extracción de datos, alineación con condiciones de borde, construcción de scoring de iniciativas.",
    asignaciones: [{ rolId: 1, hTerreno: 0, hBackoffice: 6 }, { rolId: 2, hTerreno: 0, hBackoffice: 8 }],
    traslados: [],
    materiales: [{ desc: "Herramienta de scoring / Miro", uf: 0.2 }],
  },
  {
    id: 4, nombre: "Mesa de calibración con stakeholders", modalidad: "Presencial", tipo: "Ejecución",
    descripcion: "Scoring colectivo con subgerente, líderes zonales y encargados. Definición del portafolio final.",
    asignaciones: [{ rolId: 1, hTerreno: 4, hBackoffice: 1 }, { rolId: 2, hTerreno: 3, hBackoffice: 1 }],
    traslados: [{ cat: "Pasaje aéreo", uf: 1 }, { cat: "Viáticos (alimentación)", uf: 0.5 }],
    materiales: [{ desc: "Impresión matriz de scoring", uf: 0.3 }, { desc: "Papelería", uf: 0.2 }],
  },
  {
    id: 5, nombre: "15 Entrevistas 1:1 con líderes de planta", modalidad: "Remoto", tipo: "Ejecución",
    descripcion: "Sesión de trabajo individual: planes de acción por planta.",
    asignaciones: [{ rolId: 1, hTerreno: 0, hBackoffice: 4 }, { rolId: 2, hTerreno: 15, hBackoffice: 10 }],
    traslados: [],
    materiales: [{ desc: "Plantilla de plan de trabajo (x15)", uf: 0.5 }],
  },
  {
    id: 6, nombre: "Diseño y entrega del roadmap", modalidad: "Remoto", tipo: "Entregable",
    descripcion: "Construcción del roadmap consolidado. Presentación remota a líderes zonales.",
    asignaciones: [{ rolId: 1, hTerreno: 0, hBackoffice: 5 }, { rolId: 2, hTerreno: 0, hBackoffice: 4 }, { rolId: 3, hTerreno: 0, hBackoffice: 8 }],
    traslados: [],
    materiales: [{ desc: "Diseño e impresión del roadmap", uf: 1.0 }, { desc: "Licencia herramienta de presentación", uf: 0.2 }],
  },
  {
    id: 7, nombre: "Seguimiento 15 · 30 · 60 · 90 días", modalidad: "Remoto", tipo: "Seguimiento",
    descripcion: "4 sesiones de seguimiento con el equipo de control de gestión. Se revisa avance de indicadores en el dashboard (propio o del cliente), se detectan desviaciones y se ajustan planes de acción.",
    asignaciones: [{ rolId: 1, hTerreno: 0, hBackoffice: 4 }, { rolId: 2, hTerreno: 0, hBackoffice: 4 }],
    traslados: [],
    materiales: [{ desc: "Informe de seguimiento (x4)", uf: 0.8 }, { desc: "Actualización dashboard", uf: 0.4 }],
  },
];

function HonorariosRow({ roles, fases, costoHonorarios, ufValor }) {
  const [open, setOpen] = useState(false);

  const porRol = roles.map(r => {
    const total = fases.reduce((sum, fase) =>
      sum + fase.asignaciones.reduce((s, a) =>
        a.rolId === r.id ? s + a.hTerreno * r.terreno + a.hBackoffice * r.backoffice : s, 0), 0);
    const hTerreno = fases.reduce((sum, fase) =>
      sum + fase.asignaciones.reduce((s, a) => a.rolId === r.id ? s + a.hTerreno : s, 0), 0);
    const hBack = fases.reduce((sum, fase) =>
      sum + fase.asignaciones.reduce((s, a) => a.rolId === r.id ? s + a.hBackoffice : s, 0), 0);
    return { ...r, total, hTerreno, hBack };
  }).filter(r => r.total > 0);

  return (
    <div style={{ borderBottom: "1px solid " + C.faint }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", cursor: "pointer" }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: C.green, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, color: C.muted }}>Honorarios equipo</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{fmtUF(costoHonorarios)}</span>
        <span style={{ fontSize: 12, color: C.muted, minWidth: 90, textAlign: "right" }}>{fmt(costoHonorarios * ufValor)}</span>
        <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ background: "#111", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
          {porRol.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < porRol.length - 1 ? "1px solid " + C.faint : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{r.nombre}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {r.hTerreno}h terreno × {r.terreno} UF &nbsp;·&nbsp; {r.hBack}h back × {r.backoffice} UF
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{fmtUF(r.total)}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmt(r.total * ufValor)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhaseRow({ fase, roles, onUpdate }) {
  const [open, setOpen] = useState(false);
  const getRol = (id) => roles.find(r => r.id === id);

  const costoAsig = fase.asignaciones.reduce((sum, a) => {
    const r = getRol(a.rolId);
    return r ? sum + a.hTerreno * r.terreno + a.hBackoffice * r.backoffice : sum;
  }, 0);
  const costoTraslados = fase.traslados.reduce((sum, t) => sum + (t.uf || 0), 0);
  const costoMateriales = fase.materiales.reduce((sum, m) => sum + (m.uf || 0), 0);
  const total = costoAsig + costoTraslados + costoMateriales;

  const updArr = (key, arr) => onUpdate(Object.assign({}, fase, { [key]: arr }));

  const updateAsig = (i, field, val) => updArr("asignaciones", fase.asignaciones.map((a, idx) => idx === i ? Object.assign({}, a, { [field]: val }) : a));
  const removeAsig = (i) => updArr("asignaciones", fase.asignaciones.filter((_, idx) => idx !== i));
  const addAsig = () => { const r = roles[0]; if (r) updArr("asignaciones", fase.asignaciones.concat([{ rolId: r.id, hTerreno: 0, hBackoffice: 0 }])); };

  const updateTraslado = (i, field, val) => updArr("traslados", fase.traslados.map((t, idx) => idx === i ? Object.assign({}, t, { [field]: val }) : t));
  const removeTraslado = (i) => updArr("traslados", fase.traslados.filter((_, idx) => idx !== i));
  const addTraslado = () => updArr("traslados", fase.traslados.concat([{ cat: "Pasaje aéreo", uf: 0 }]));

  const updateMaterial = (i, field, val) => updArr("materiales", fase.materiales.map((m, idx) => idx === i ? Object.assign({}, m, { [field]: val }) : m));
  const removeMaterial = (i) => updArr("materiales", fase.materiales.filter((_, idx) => idx !== i));
  const addMaterial = () => updArr("materiales", fase.materiales.concat([{ desc: "Nuevo ítem", uf: 0 }]));

  const inp = (extra) => Object.assign({ background: C.card, border: "1px solid " + C.border, borderRadius: 6, padding: "6px 8px", fontSize: 12, color: C.text, outline: "none" }, extra);
  const btn = (extra) => Object.assign({ background: "none", border: "1px dashed " + C.border, borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: C.muted }, extra);

  return (
    <div style={{ borderBottom: "1px solid " + C.border }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0", cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.faint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0 }}>{fase.id}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{fase.nombre}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag label={fase.modalidad} color={fase.modalidad === "Presencial" ? C.yellow : C.blue} />
            <Tag label={fase.tipo} color={C.muted} />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{fmtUF(total)}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{fmt(total * UF_DEFAULT)}</div>
        </div>
        <div style={{ color: C.muted, fontSize: 12, marginLeft: 4 }}>{open ? "▲" : "▼"}</div>
      </div>

      {open && (
        <div style={{ background: "#111", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>{fase.descripcion}</p>

          {/* Equipo */}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Equipo</div>
          {fase.asignaciones.map((a, i) => {
            const r = getRol(a.rolId);
            const sub = r ? a.hTerreno * r.terreno + a.hBackoffice * r.backoffice : 0;
            return (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                <select value={a.rolId} onChange={e => updateAsig(i, "rolId", Number(e.target.value))} style={inp({ flex: "1 1 140px" })}>
                  {roles.map(r2 => <option key={r2.id} value={r2.id}>{r2.nombre}</option>)}
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="number" min={0} max={100} step={0.5} value={a.hTerreno} onChange={e => updateAsig(i, "hTerreno", Number(e.target.value))} style={inp({ width: 52, textAlign: "center" })} />
                  <span style={{ fontSize: 11, color: C.muted }}>h terreno</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="number" min={0} max={100} step={0.5} value={a.hBackoffice} onChange={e => updateAsig(i, "hBackoffice", Number(e.target.value))} style={inp({ width: 52, textAlign: "center" })} />
                  <span style={{ fontSize: 11, color: C.muted }}>h back</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 55 }}>{fmtUF(sub)}</span>
                <button onClick={() => removeAsig(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18 }}>×</button>
              </div>
            );
          })}
          <button onClick={addAsig} style={btn({ marginBottom: 16 })}>+ Agregar persona</button>

          {/* Traslados */}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 8 }}>Traslados y viáticos</div>
          {fase.traslados.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <select value={t.cat} onChange={e => updateTraslado(i, "cat", e.target.value)} style={inp({ flex: 1 })}>
                {TRASLADO_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" min={0} max={100} step={0.1} value={t.uf} onChange={e => updateTraslado(i, "uf", Number(e.target.value))} style={inp({ width: 70, textAlign: "center" })} />
              <span style={{ fontSize: 11, color: C.muted }}>UF</span>
              <button onClick={() => removeTraslado(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18 }}>×</button>
            </div>
          ))}
          <button onClick={addTraslado} style={btn({ marginBottom: 16 })}>+ Agregar traslado</button>

          {/* Materiales */}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 8 }}>Materiales y entregables</div>
          {fase.materiales.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input value={m.desc} onChange={e => updateMaterial(i, "desc", e.target.value)} style={inp({ flex: 1 })} />
              <input type="number" min={0} max={100} step={0.1} value={m.uf} onChange={e => updateMaterial(i, "uf", Number(e.target.value))} style={inp({ width: 70, textAlign: "center" })} />
              <span style={{ fontSize: 11, color: C.muted }}>UF</span>
              <button onClick={() => removeMaterial(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18 }}>×</button>
            </div>
          ))}
          <button onClick={addMaterial} style={btn({ marginBottom: 16 })}>+ Agregar material</button>

          {/* Total fase */}
          <div style={{ background: C.bg, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: C.muted }}>Total fase</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{fmtUF(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [roles, setRoles] = useState(ROLES_DEFAULT);
  const [nextRolId, setNextRolId] = useState(10);
  const [fases, setFases] = useState(FASES_INIT);
  const [buffer, setBuffer] = useState(15);
  const [utilidad, setUtilidad] = useState(20);
  const [ufValor, setUfValor] = useState(UF_DEFAULT);

  const addRol = () => { setRoles(roles.concat([{ id: nextRolId, nombre: "Nuevo rol", terreno: 3, backoffice: 2 }])); setNextRolId(nextRolId + 1); };
  const updateRol = (id, field, val) => setRoles(roles.map(r => r.id === id ? Object.assign({}, r, { [field]: val }) : r));
  const removeRol = (id) => setRoles(roles.filter(r => r.id !== id));
  const updateFase = (i, updated) => setFases(fases.map((f, idx) => idx === i ? updated : f));

  const totalesFases = useMemo(() => fases.map(fase => {
    const asig = fase.asignaciones.reduce((sum, a) => {
      const r = roles.find(r2 => r2.id === a.rolId);
      return r ? sum + a.hTerreno * r.terreno + a.hBackoffice * r.backoffice : sum;
    }, 0);
    const trasl = fase.traslados.reduce((sum, t) => sum + (t.uf || 0), 0);
    const mat = fase.materiales.reduce((sum, m) => sum + (m.uf || 0), 0);
    return asig + trasl + mat;
  }), [fases, roles]);

  const subtotal = totalesFases.reduce((a, b) => a + b, 0);
  const bufferUF = subtotal * buffer / 100;
  const costoTotal = subtotal + bufferUF;
  const utilidadUF = costoTotal * utilidad / 100;
  const precioFinal = costoTotal + utilidadUF;

  const costoHonorarios = useMemo(() => fases.reduce((sum, fase) =>
    sum + fase.asignaciones.reduce((s, a) => {
      const r = roles.find(r2 => r2.id === a.rolId);
      return r ? s + a.hTerreno * r.terreno + a.hBackoffice * r.backoffice : s;
    }, 0), 0), [fases, roles]);

  const costoTrasladosTotal = useMemo(() => fases.reduce((sum, fase) =>
    sum + fase.traslados.reduce((s, t) => s + (t.uf || 0), 0), 0), [fases]);

  const costoMaterialesTotal = useMemo(() => fases.reduce((sum, fase) =>
    sum + fase.materiales.reduce((s, m) => s + (m.uf || 0), 0), 0), [fases]);

  const inp = (extra) => Object.assign({ background: "transparent", border: "1px solid " + C.border, borderRadius: 8, padding: "10px 14px", fontSize: 20, fontWeight: 800, color: C.text, outline: "none", boxSizing: "border-box", width: "100%" }, extra);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: C.bg, minHeight: "100vh", padding: "32px 16px", color: C.text }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Cotización</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: "0 0 8px", lineHeight: 1.1 }}>Cascada Estratégica</h1>
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Proceso de alineación estratégica · 6 fases · 3 territorios · 15 líderes</p>
        </div>

        {/* Equipo */}
        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 16px" }}>Equipo y tarifas</h2>
          <div style={{ display: "flex", gap: 8, fontSize: 11, color: C.muted, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid " + C.border }}>
            <span style={{ flex: 2 }}>Rol</span>
            <span style={{ flex: 1, textAlign: "center" }}>UF/h terreno</span>
            <span style={{ flex: 1, textAlign: "center" }}>UF/h backoffice</span>
            <span style={{ width: 24 }} />
          </div>
          {roles.map(r => (
            <div key={r.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input value={r.nombre} onChange={e => updateRol(r.id, "nombre", e.target.value)}
                style={{ flex: 2, background: "transparent", border: "1px solid " + C.border, borderRadius: 6, padding: "6px 10px", fontSize: 13, color: C.text, outline: "none" }} />
              <input type="number" min={0.5} max={20} step={0.5} value={r.terreno} onChange={e => updateRol(r.id, "terreno", Number(e.target.value))}
                style={{ flex: 1, background: "transparent", border: "1px solid " + C.border, borderRadius: 6, padding: "6px 8px", fontSize: 13, color: C.text, textAlign: "center", outline: "none" }} />
              <input type="number" min={0.5} max={20} step={0.5} value={r.backoffice} onChange={e => updateRol(r.id, "backoffice", Number(e.target.value))}
                style={{ flex: 1, background: "transparent", border: "1px solid " + C.border, borderRadius: 6, padding: "6px 8px", fontSize: 13, color: C.text, textAlign: "center", outline: "none" }} />
              <button onClick={() => removeRol(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18, width: 24 }}>×</button>
            </div>
          ))}
          <button onClick={addRol} style={{ marginTop: 8, width: "100%", padding: 8, border: "1px dashed " + C.border, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 13, color: C.muted }}>+ Agregar rol</button>
        </div>

        {/* Config global */}
        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 16px" }}>Parámetros globales</h2>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Buffer complejidad (%)", val: buffer, set: setBuffer, min: 0, max: 50, step: 5 },
              { label: "Valor UF (CLP)", val: ufValor, set: setUfValor, min: 30000, max: 50000, step: 100 },
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</div>
                <input type="number" min={item.min} max={item.max} step={item.step} value={item.val} onChange={e => item.set(Number(e.target.value))} style={inp({})} />
              </div>
            ))}
          </div>
        </div>

        {/* Fases */}
        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 8px" }}>Fases del proyecto</h2>
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px" }}>Haz click en cada fase para ver y editar el detalle.</p>
          {fases.map((f, i) => <PhaseRow key={f.id} fase={f} roles={roles} onUpdate={updated => updateFase(i, updated)} />)}
        </div>

        {/* Resumen */}
        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 20px" }}>Resumen de costos</h2>

          {/* Honorarios con desplegable por rol */}
          <HonorariosRow roles={roles} fases={fases} costoHonorarios={costoHonorarios} ufValor={ufValor} />

          {[
            { label: "Traslados y viáticos", val: costoTrasladosTotal, color: C.yellow },
            { label: "Materiales y entregables", val: costoMaterialesTotal, color: C.blue },
            { label: "Buffer " + buffer + "% (complejidad)", val: bufferUF, color: C.muted },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid " + C.faint }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: C.muted }}>{item.label}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{fmtUF(item.val)}</span>
              <span style={{ fontSize: 12, color: C.muted, minWidth: 90, textAlign: "right" }}>{fmt(item.val * ufValor)}</span>
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid " + C.border }}>
            <div style={{ width: 10, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.text }}>Costo total</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{fmtUF(costoTotal)}</span>
            <span style={{ fontSize: 12, color: C.muted, minWidth: 90, textAlign: "right" }}>{fmt(costoTotal * ufValor)}</span>
          </div>

          {/* Slider utilidad */}
          <div style={{ background: C.faint, borderRadius: 10, padding: 16, margin: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Utilidad</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{utilidad}%</span>
            </div>
            <input type="range" min={10} max={50} step={1} value={utilidad} onChange={e => setUtilidad(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.green, cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginTop: 3 }}>
              <span>10%</span><span>50%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Utilidad en UF</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>+ {fmtUF(utilidadUF)}</span>
            </div>
          </div>

          {/* Precio final */}
          <div style={{ background: C.text, borderRadius: 12, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Precio al cliente</div>
              <div style={{ fontSize: 13, color: "#777" }}>Costo + {utilidad}% utilidad · resultado garantizado</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.bg, lineHeight: 1 }}>{fmtUF(precioFinal)}</div>
              <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{fmt(precioFinal * ufValor)}</div>
            </div>
          </div>
        </div>

        {/* Garantías */}
        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 16px" }}>Lo que garantiza este precio</h2>
          {[
            "1 workshop estratégico presencial con gerencia y liderazgo",
            "3 workshops territoriales presenciales (norte-norte, norte-centro, sur)",
            "Síntesis y scoring de iniciativas por equipo consultor",
            "1 mesa de calibración presencial con stakeholders clave",
            "15 entrevistas 1:1 remotas con líderes de planta",
            "Roadmap consolidado con planes individuales validados",
            "Presentación remota del roadmap a líderes zonales",
            "Seguimiento remoto a los 15, 30, 60 y 90 días con control de gestión",
            "Llegamos hasta el resultado comprometido: portafolio aprobado, planes operativos y seguimiento de avance.",
          ].map((item, i, arr) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid " + C.faint : "none" }}>
              <span style={{ color: C.green, fontSize: 14, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: C.faint, textAlign: "center", marginTop: 16 }}>
          Valor UF referencial: {fmt(ufValor)} · Precio final en UF del día de emisión de factura.
        </p>
      </div>
    </div>
  );
}