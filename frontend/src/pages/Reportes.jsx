```jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";
import { obtenerPerfil, cerrarSesion } from "../services/authService";
import "./Reportes.css";

const dinero = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export default function Reportes() {
  const navigate = useNavigate();
  const hoy = new Date();
  const [nombre, setNombre] = useState("Usuario");
  const [tipo, setTipo] = useState("mensual");
  const [mes, setMes] = useState(String(hoy.getMonth() + 1));
  const [anio, setAnio] = useState(String(hoy.getFullYear()));
  const [desde, setDesde] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`);
  const [hasta, setHasta] = useState(hoy.toISOString().slice(0, 10));
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      const usuario = await obtenerPerfil().catch(() => null);
      setNombre(usuario?.nombre || usuario?.nombre_usuario || usuario?.correo || "Usuario");

      let respuesta;
      if (tipo === "mensual") {
        respuesta = await api.get("/reportes/mensual", {
          params: { mes: Number(mes), anio: Number(anio) },
        });
      } else if (tipo === "anual") {
        respuesta = await api.get("/reportes/anual", {
          params: { anio: Number(anio) },
        });
      } else {
        respuesta = await api.get("/reportes/periodo", {
          params: { desde, hasta },
        });
      }
      setReporte(respuesta.data);
    } catch (e) {
      setReporte(null);
      setError(
        e.response?.data?.mensaje ||
        "No se pudo generar el reporte. Revisa los parámetros que espera tu backend."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

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

  function buscarNumero(obj, claves) {
    for (const clave of claves) {
      if (obj?.[clave] !== undefined && obj?.[clave] !== null) {
        const n = Number(obj[clave]);
        if (Number.isFinite(n)) return n;
      }
    }
    return null;
  }

  const datos = reporte?.reporte || reporte?.resumen || reporte || {};
  const ingresos = buscarNumero(datos, ["ingresos", "total_ingresos", "ingresos_totales"]);
  const gastos = buscarNumero(datos, ["gastos", "total_gastos", "gastos_totales"]);
  const balance = buscarNumero(datos, ["balance", "saldo", "balance_neto", "disponible"]);
  const filas = Array.isArray(reporte)
    ? reporte
    : Array.isArray(reporte?.datos)
      ? reporte.datos
      : Array.isArray(reporte?.reporte)
        ? reporte.reporte
        : [];

  return (
    <div className="reportes-layout">
      <Sidebar moduloActivo="reportes" activeModule="reportes" onNavigate={navegar} onLogout={salir} />
      <main className="reportes-main">
        <Header nombre={nombre} />
        <div className="reportes-contenido">
          <header className="reportes-hero">
            <div>
              <span className="reportes-eyebrow">RESUMEN FINANCIERO</span>
              <h1>Reportes financieros</h1>
              <p>Analiza tus ingresos, gastos y balance.</p>
            </div>
            <div className="reportes-hero-icon"><BarChart3 size={30} /></div>
          </header>

          <section className="reportes-panel">
            <h2>Configurar reporte</h2>
            <div className="reportes-filtros">
              <label>Tipo de reporte
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="mensual">Mensual</option>
                  <option value="anual">Anual</option>
                  <option value="periodo">Por periodo</option>
                </select>
              </label>

              {tipo === "mensual" && (
                <label>Mes
                  <select value={mes} onChange={(e) => setMes(e.target.value)}>
                    {[
                      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
                    ].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </label>
              )}

              {tipo !== "periodo" ? (
                <label>Año
                  <input type="number" min="2000" max="2100" value={anio} onChange={(e) => setAnio(e.target.value)} />
                </label>
              ) : (
                <>
                  <label>Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
                  <label>Hasta<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
                </>
              )}

              <button className="reportes-btn" onClick={cargar} type="button" disabled={cargando}>
                <RefreshCw size={16} /> {cargando ? "Generando..." : "Generar reporte"}
              </button>
            </div>
          </section>

          {error && <div className="reportes-alerta">{error}</div>}

          {reporte && (
            <>
              <section className="reportes-resumen">
                <article>
                  <div className="reportes-card-icon ingresos"><TrendingUp size={20} /></div>
                  <span>Ingresos</span>
                  <strong>{ingresos === null ? "No disponible" : dinero.format(ingresos)}</strong>
                </article>
                <article>
                  <div className="reportes-card-icon gastos"><TrendingDown size={20} /></div>
                  <span>Gastos</span>
                  <strong>{gastos === null ? "No disponible" : dinero.format(gastos)}</strong>
                </article>
                <article>
                  <div className="reportes-card-icon balance"><Wallet size={20} /></div>
                  <span>Balance</span>
                  <strong>{balance === null ? (ingresos !== null && gastos !== null ? dinero.format(ingresos - gastos) : "No disponible") : dinero.format(balance)}</strong>
                </article>
              </section>

              <section className="reportes-panel">
                <h2>Detalle del reporte</h2>
                {filas.length > 0 ? (
                  <div className="reportes-tabla-contenedor">
                    <table className="reportes-tabla">
                      <thead>
                        <tr>
                          {Object.keys(filas[0]).map((k) => <th key={k}>{k.replaceAll("_", " ")}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {filas.map((fila, i) => (
                          <tr key={fila.id ?? fila.id_reporte ?? i}>
                            {Object.values(fila).map((valor, j) => (
                              <td key={j}>{valor === null ? "—" : typeof valor === "object" ? JSON.stringify(valor) : String(valor)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <pre className="reportes-json">{JSON.stringify(reporte, null, 2)}</pre>
                )}
              </section>
            </>
          )}

          {!reporte && !error && !cargando && (
            <div className="reportes-vacio">
              Selecciona los filtros y pulsa “Generar reporte”.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```