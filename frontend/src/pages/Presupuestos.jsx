
import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Presupuestos.css";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const dinero = (valor) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(valor) || 0);

function Presupuestos() {
  const navigate = useNavigate();
  const hoy = new Date();

  const [presupuestos, setPresupuestos] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [monto, setMonto] = useState("");
  const [mes, setMes] = useState(String(hoy.getMonth() + 1));
  const [anio, setAnio] = useState(String(hoy.getFullYear()));
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarPresupuestos = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await api.get("/presupuestos");
      const datos = Array.isArray(respuesta.data)
        ? respuesta.data
        : respuesta.data?.presupuestos;

      setPresupuestos(Array.isArray(datos) ? datos : []);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No se pudieron cargar los presupuestos."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPresupuestos();
  }, []);

  const crearPresupuesto = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    const montoNumero = Number(monto);
    const mesNumero = Number(mes);
    const anioNumero = Number(anio);

    if (!categoria.trim()) {
      setError("Escribe una categoría.");
      return;
    }

    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      setError("El límite debe ser mayor que cero.");
      return;
    }

    if (
      !Number.isInteger(mesNumero) ||
      mesNumero < 1 ||
      mesNumero > 12 ||
      !Number.isInteger(anioNumero) ||
      anioNumero < 2000 ||
      anioNumero > 2100
    ) {
      setError("Revisa el mes y el año.");
      return;
    }

    try {
      setGuardando(true);

      await api.post("/presupuestos", {
        categoria: categoria.trim(),
        monto_limite: montoNumero,
        mes: mesNumero,
        anio: anioNumero,
      });

      setCategoria("");
      setMonto("");
      setMensaje("Presupuesto creado correctamente.");
      await cargarPresupuestos();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No se pudo guardar el presupuesto."
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminarPresupuesto = async (id) => {
    if (!window.confirm("¿Deseas eliminar este presupuesto?")) return;

    setError("");
    setMensaje("");

    try {
      await api.delete(`/presupuestos/${id}`);
      setMensaje("Presupuesto eliminado.");
      await cargarPresupuestos();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No se pudo eliminar el presupuesto."
      );
    }
  };

  const navegar = (modulo) => {
    const rutas = {
      dashboard: "/dashboard",
      movimientos: "/movimientos",
      presupuestos: "/presupuestos",
      metas: "/metas",
      deudas: "/deudas",
      reportes: "/reportes",
      configuracion: "/perfil",
    };

    if (rutas[modulo.id]) navigate(rutas[modulo.id]);
  };

  const salir = () => {
    sessionStorage.removeItem("finazz_token");
    navigate("/login", { replace: true });
  };

  const totalLimites = presupuestos.reduce(
    (suma, p) => suma + Number(p.monto_limite || 0), 0
  );

  const totalGastado = presupuestos.reduce(
    (suma, p) => suma + Number(p.total_gastado || 0), 0
  );

  return (
    <div className="app-layout">
      <Sidebar
        moduloActivo="presupuestos"
        activeModule="presupuestos"
        onNavigate={navegar}
        onLogout={salir}
      />

      <main className="app-main">
        <Header nombre="Mis finanzas" />

        <section className="presupuestos-page">
          <div className="presupuestos-heading">
            <div>
              <span className="presupuestos-eyebrow">PLANIFICACIÓN FINANCIERA</span>
              <h1>Presupuestos</h1>
              <p>Define límites de gasto y controla tu dinero.</p>
            </div>

            <button
              type="button"
              className="presupuesto-refresh"
              onClick={cargarPresupuestos}
              disabled={cargando}
            >
              <RefreshCw size={17} />
              Actualizar
            </button>
          </div>

          <div className="presupuestos-resumen">
            <article className="presupuesto-resumen-card">
              <span>Límite total</span>
              <strong>{dinero(totalLimites)}</strong>
            </article>
            <article className="presupuesto-resumen-card">
              <span>Gasto registrado</span>
              <strong>{dinero(totalGastado)}</strong>
            </article>
            <article className="presupuesto-resumen-card">
              <span>Disponible estimado</span>
              <strong>{dinero(totalLimites - totalGastado)}</strong>
            </article>
          </div>

          <section className="presupuesto-panel">
            <div className="presupuesto-panel-heading">
              <div>
                <h2><Plus size={20} /> Crear presupuesto</h2>
                <p>Configura un límite por categoría y periodo.</p>
              </div>
            </div>

            <form className="presupuesto-form" onSubmit={crearPresupuesto}>
              <div>
                <label htmlFor="categoria">Categoría</label>
                <input
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej. Alimentación"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label htmlFor="monto">Límite (MXN)</label>
                <input
                  id="monto"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="5000"
                  required
                />
              </div>

              <div>
                <label htmlFor="mes">Mes</label>
                <select
                  id="mes"
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                >
                  {MESES.map((nombre, i) => (
                    <option key={nombre} value={i + 1}>{nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="anio">Año</label>
                <input
                  id="anio"
                  type="number"
                  min="2000"
                  max="2100"
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="presupuesto-submit"
                disabled={guardando}
              >
                <Plus size={18} />
                {guardando ? "Guardando..." : "Guardar presupuesto"}
              </button>
            </form>

            {error && <p className="presupuesto-error" role="alert">{error}</p>}
            {mensaje && <p className="presupuesto-success" role="status">{mensaje}</p>}
          </section>

          <section className="presupuesto-panel">
            <div className="presupuesto-panel-heading">
              <div>
                <h2><Wallet size={20} /> Tus presupuestos</h2>
                <p>{presupuestos.length} presupuesto(s) registrados</p>
              </div>
            </div>

            {cargando ? (
              <p className="presupuesto-empty">Cargando presupuestos...</p>
            ) : presupuestos.length === 0 ? (
              <p className="presupuesto-empty">
                Aún no hay presupuestos. Crea el primero con el formulario.
              </p>
            ) : (
              <div className="presupuesto-lista">
                {presupuestos.map((p) => {
                  const id = p.id_presupuesto ?? p.id;
                  const limite = Number(p.monto_limite || 0);
                  const gastado = Number(p.total_gastado || 0);
                  const porcentaje = limite > 0
                    ? Math.min((gastado / limite) * 100, 100)
                    : 0;

                  return (
                    <article className="presupuesto-item" key={id}>
                      <div className="presupuesto-item-top">
                        <div>
                          <h3>{p.categoria}</h3>
                          <span>
                            {MESES[Number(p.mes) - 1] || p.mes} {p.anio}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="presupuesto-delete"
                          onClick={() => eliminarPresupuesto(id)}
                          aria-label={`Eliminar presupuesto ${p.categoria}`}
                          title="Eliminar presupuesto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="presupuesto-cifras">
                        <span>Gastado: <strong>{dinero(gastado)}</strong></span>
                        <span>Límite: <strong>{dinero(limite)}</strong></span>
                      </div>

                      <div
                        className="presupuesto-barra"
                        role="progressbar"
                        aria-valuenow={Math.round(porcentaje)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div style={{ width: `${porcentaje}%` }} />
                      </div>

                      <p className="presupuesto-disponible">
                        {dinero(p.disponible ?? limite - gastado)} disponibles
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default Presupuestos;
