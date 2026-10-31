```jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Plus, RefreshCw, Trash2, Wallet } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";
import { obtenerPerfil, cerrarSesion } from "../services/authService";
import "./Deudas.css";

const dinero = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export default function Deudas() {
  const navigate = useNavigate();
  const [deudas, setDeudas] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [pagoDeuda, setPagoDeuda] = useState(null);
  const [montoPago, setMontoPago] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    tipo: "Tarjeta de crédito",
    monto_total: "",
    saldo_pendiente: "",
    tasa_interes: "",
    fecha_vencimiento: "",
  });

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      const [res, usuario] = await Promise.all([
        api.get("/deudas"),
        obtenerPerfil().catch(() => null),
      ]);
      const data = res.data;
      setDeudas(Array.isArray(data) ? data : data.deudas || []);
      setNombreUsuario(
        usuario?.nombre || usuario?.nombre_usuario || usuario?.correo || "Usuario"
      );
    } catch (e) {
      setError(e.response?.data?.mensaje || "No se pudieron cargar las deudas.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function crear(e) {
    e.preventDefault();
    setError("");
    setMensaje("");

    const total = Number(form.monto_total);
    const saldo = Number(form.saldo_pendiente || form.monto_total);
    if (!form.nombre.trim() || total <= 0 || saldo < 0) {
      setError("Revisa el nombre y las cantidades.");
      return;
    }

    try {
      await api.post("/deudas", {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        monto_total: total,
        saldo_pendiente: saldo,
        tasa_interes: Number(form.tasa_interes || 0),
        fecha_vencimiento: form.fecha_vencimiento || null,
      });
      setForm({
        nombre: "", tipo: "Tarjeta de crédito",
        monto_total: "", saldo_pendiente: "",
        tasa_interes: "", fecha_vencimiento: "",
      });
      setMensaje("Deuda registrada.");
      await cargar();
    } catch (e) {
      setError(
        e.response?.data?.mensaje ||
        "No se pudo crear la deuda. Verifica los nombres de campos requeridos por el backend."
      );
    }
  }

  async function registrarPago(e) {
    e.preventDefault();
    if (!pagoDeuda) return;
    const monto = Number(montoPago);
    if (monto <= 0) {
      setError("El pago debe ser mayor que cero.");
      return;
    }

    try {
      const id = pagoDeuda.id_deuda ?? pagoDeuda.id;
      await api.post(`/deudas/${id}/pagos`, { monto });
      setPagoDeuda(null);
      setMontoPago("");
      setMensaje("Pago registrado.");
      setError("");
      await cargar();
    } catch (e) {
      setError(e.response?.data?.mensaje || "No se pudo registrar el pago.");
    }
  }

  async function eliminar(deuda) {
    if (!window.confirm(`¿Eliminar "${deuda.nombre || deuda.descripcion || "esta deuda"}"?`)) return;
    try {
      await api.delete(`/deudas/${deuda.id_deuda ?? deuda.id}`);
      setMensaje("Deuda eliminada.");
      setError("");
      await cargar();
    } catch (e) {
      setError(e.response?.data?.mensaje || "No se pudo eliminar la deuda.");
    }
  }

  function navegar(modulo) {
    const rutas = {
      dashboard: "/dashboard", movimientos: "/movimientos",
      presupuestos: "/presupuestos", metas: "/metas",
      deudas: "/deudas", reportes: "/reportes",
      configuracion: "/perfil",
    };
    if (rutas[modulo.id]) navigate(rutas[modulo.id]);
  }

  function salir() {
    cerrarSesion();
    navigate("/login", { replace: true });
  }

  const saldoTotal = deudas.reduce(
    (s, d) => s + Number(d.saldo_pendiente ?? d.saldo_actual ?? d.monto_pendiente ?? 0), 0
  );
  const montoOriginal = deudas.reduce(
    (s, d) => s + Number(d.monto_total ?? d.monto_original ?? 0), 0
  );

  return (
    <div className="deudas-layout">
      <Sidebar moduloActivo="deudas" activeModule="deudas" onNavigate={navegar} onLogout={salir} />
      <main className="deudas-main">
        <Header nombre={nombreUsuario} />
        <div className="deudas-contenido">
          <header className="deudas-hero">
            <div>
              <span className="deudas-eyebrow">CONTROL FINANCIERO</span>
              <h1>Deudas y tarjetas</h1>
              <p>Administra tus saldos y registra tus pagos.</p>
            </div>
            <div className="deudas-hero-icon"><CreditCard size={30} /></div>
          </header>

          {error && <div className="deudas-alerta error">{error}</div>}
          {mensaje && <div className="deudas-alerta exito">{mensaje}</div>}

          <section className="deudas-resumen">
            <article><span>Deudas registradas</span><strong>{deudas.length}</strong></article>
            <article><span>Monto original</span><strong>{dinero.format(montoOriginal)}</strong></article>
            <article><span>Saldo pendiente</span><strong>{dinero.format(saldoTotal)}</strong></article>
          </section>

          <section className="deudas-panel">
            <div className="deudas-panel-titulo">
              <div><h2>Registrar deuda</h2><p>Agrega una tarjeta o deuda pendiente.</p></div>
              <Plus size={22} />
            </div>
            <form className="deudas-form" onSubmit={crear}>
              <label>Nombre<input name="nombre" value={form.nombre} onChange={cambiar} placeholder="Ej. Tarjeta bancaria" required /></label>
              <label>Tipo
                <select name="tipo" value={form.tipo} onChange={cambiar}>
                  <option>Tarjeta de crédito</option>
                  <option>Préstamo personal</option>
                  <option>Crédito automotriz</option>
                  <option>Hipoteca</option>
                  <option>Otra deuda</option>
                </select>
              </label>
              <label>Monto original (MXN)<input type="number" min="0.01" step="0.01" name="monto_total" value={form.monto_total} onChange={cambiar} required /></label>
              <label>Saldo pendiente (MXN)<input type="number" min="0" step="0.01" name="saldo_pendiente" value={form.saldo_pendiente} onChange={cambiar} placeholder="Si se deja vacío, usa el monto original" /></label>
              <label>Tasa de interés (%)<input type="number" min="0" step="0.01" name="tasa_interes" value={form.tasa_interes} onChange={cambiar} placeholder="Opcional" /></label>
              <label>Próximo vencimiento<input type="date" name="fecha_vencimiento" value={form.fecha_vencimiento} onChange={cambiar} /></label>
              <button className="deudas-btn primario" type="submit"><Plus size={17} /> Registrar deuda</button>
            </form>
          </section>

          <section className="deudas-panel">
            <div className="deudas-panel-titulo">
              <div><h2>Mis deudas</h2><p>Revisa tu saldo y registra abonos.</p></div>
              <button className="deudas-btn neutro" onClick={cargar} type="button"><RefreshCw size={16} /> Actualizar</button>
            </div>
            {cargando ? <p className="deudas-vacio">Cargando deudas...</p> :
              deudas.length === 0 ? (
                <div className="deudas-vacio"><Wallet size={36} /><strong>No hay deudas registradas</strong><span>Registra tu primera deuda en el formulario.</span></div>
              ) : (
                <div className="deudas-lista">
                  {deudas.map((d) => {
                    const id = d.id_deuda ?? d.id;
                    const saldo = Number(d.saldo_pendiente ?? d.saldo_actual ?? d.monto_pendiente ?? 0);
                    const total = Number(d.monto_total ?? d.monto_original ?? saldo);
                    const pagado = Math.max(0, total - saldo);
                    const progreso = total > 0 ? Math.min(100, pagado / total * 100) : 0;
                    return (
                      <article className="deudas-item" key={id}>
                        <div className="deudas-item-top">
                          <div className="deudas-card-icon"><CreditCard size={22} /></div>
                          <div className="deudas-item-nombre"><h3>{d.nombre || d.descripcion || d.tipo || "Deuda"}</h3><span>{d.tipo || "Deuda"}</span></div>
                          <strong className="deudas-saldo">{dinero.format(saldo)}</strong>
                        </div>
                        <div className="deudas-barra"><div style={{ width: `${progreso}%` }} /></div>
                        <div className="deudas-cantidades"><span>Pagado: {dinero.format(pagado)}</span><span>Original: {dinero.format(total)}</span></div>
                        <div className="deudas-acciones">
                          <button className="deudas-btn primario" type="button" onClick={() => { setPagoDeuda(d); setMontoPago(""); }}>Registrar pago</button>
                          <button className="deudas-btn peligro" type="button" onClick={() => eliminar(d)}><Trash2 size={16} /> Eliminar</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
          </section>

          {pagoDeuda && (
            <div className="deudas-modal-fondo">
              <form className="deudas-modal" onSubmit={registrarPago}>
                <h2>Registrar pago</h2>
                <p>{pagoDeuda.nombre || pagoDeuda.descripcion || "Deuda"}</p>
                <label>Monto del pago (MXN)<input type="number" min="0.01" step="0.01" value={montoPago} onChange={(e) => setMontoPago(e.target.value)} required autoFocus /></label>
                <div className="deudas-acciones">
                  <button className="deudas-btn primario" type="submit">Guardar pago</button>
                  <button className="deudas-btn neutro" type="button" onClick={() => setPagoDeuda(null)}>Cancelar</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```