```jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Plus,
  PiggyBank,
  X,
  RefreshCw,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";
import { obtenerPerfil, cerrarSesion } from "../services/authService";

import "./Metas.css";

const moneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export default function Metas() {
  const navigate = useNavigate();

  const [metas, setMetas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [formulario, setFormulario] = useState({
    nombre: "",
    monto_objetivo: "",
    monto_actual: "0",
    fecha_objetivo: "",
  });

  const [metaSeleccionada, setMetaSeleccionada] = useState(null);
  const [montoAhorro, setMontoAhorro] = useState("");

  async function cargarDatos() {
    setCargando(true);
    setError("");

    try {
      const [respuestaMetas, usuario] = await Promise.all([
        api.get("/metas"),
        obtenerPerfil().catch(() => null),
      ]);

      const datos = respuestaMetas.data;
      setMetas(
        Array.isArray(datos)
          ? datos
          : datos.metas || []
      );

      setNombre(
        usuario?.nombre ||
        usuario?.nombre_usuario ||
        usuario?.correo ||
        "Usuario"
      );
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No se pudieron cargar las metas."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function cambiarCampo(evento) {
    setFormulario({
      ...formulario,
      [evento.target.name]: evento.target.value,
    });
  }

  async function crearMeta(evento) {
    evento.preventDefault();
    setError("");
    setMensaje("");

    const objetivo = Number(formulario.monto_objetivo);
    const actual = Number(formulario.monto_actual || 0);

    if (!formulario.nombre.trim() || objetivo <= 0 || actual < 0) {
      setError("Escribe un nombre y cantidades válidas.");
      return;
    }

    try {
      await api.post("/metas", {
        nombre: formulario.nombre.trim(),
        monto_objetivo: objetivo,
        monto_actual: actual,
        fecha_objetivo: formulario.fecha_objetivo || null,
      });

      setFormulario({
        nombre: "",
        monto_objetivo: "",
        monto_actual: "0",
        fecha_objetivo: "",
      });

      setMensaje("Meta registrada correctamente.");
      await cargarDatos();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No se pudo registrar la meta. Revisa los campos que requiere tu backend."
      );
    }
  }

  async function agregarAhorro(evento) {
    evento.preventDefault();
    if (!metaSeleccionada) return;

    const monto = Number(montoAhorro);

    if (monto <= 0) {
      setError("El ahorro debe ser mayor que cero.");
      return;
    }

    const id =
      metaSeleccionada.id_meta ??
      metaSeleccionada.id;

    try {
      await api.patch(`/metas/${id}/ahorrar`, {
        monto,
      });

      setMetaSeleccionada(null);
      setMontoAhorro("");
      setMensaje("Ahorro agregado correctamente.");
      setError("");
      await cargarDatos();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No se pudo agregar el ahorro."
      );
    }
  }

  async function cancelarMeta(meta) {
    const id = meta.id_meta ?? meta.id;

    if (!window.confirm(`¿Cancelar la meta "${meta.nombre}"?`)) {
      return;
    }

    try {
      await api.patch(`/metas/${id}/cancelar`);
      setMensaje("Meta cancelada.");
      setError("");
      await cargarDatos();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No se pudo cancelar la meta."
      );
    }
  }

  function seleccionarModulo(modulo) {
    const rutas = {
      dashboard: "/dashboard",
      movimientos: "/movimientos",
      presupuestos: "/presupuestos",
      metas: "/metas",
      deudas: "/deudas",
      reportes: "/reportes",
      alertas: "/alertas",
      analisis: "/analisis",
      configuracion: "/perfil",
    };

    if (rutas[modulo.id]) navigate(rutas[modulo.id]);
  }

  function salir() {
    cerrarSesion();
    navigate("/login", { replace: true });
  }

  const totalObjetivo = metas.reduce(
    (total, meta) =>
      total + Number(meta.monto_objetivo || 0),
    0
  );

  const totalAhorrado = metas.reduce(
    (total, meta) =>
      total + Number(
        meta.monto_actual ??
        meta.monto_ahorrado ??
        0
      ),
    0
  );

  return (
    <div className="metas-layout">
      <Sidebar
        moduloActivo="metas"
        activeModule="metas"
        onNavigate={seleccionarModulo}
        onLogout={salir}
      />

      <main className="metas-main">
        <Header nombre={nombre} />

        <section className="metas-contenido">
          <div className="metas-titulo">
            <div>
              <span className="metas-etiqueta">
                PLANIFICACIÓN FINANCIERA
              </span>
              <h1>Metas de ahorro</h1>
              <p>Convierte tus objetivos en un plan de ahorro.</p>
            </div>

            <div className="metas-icono-titulo">
              <Target size={30} />
            </div>
          </div>

          {error && <div className="metas-alerta error">{error}</div>}
          {mensaje && <div className="metas-alerta exito">{mensaje}</div>}

          <div className="metas-resumen">
            <article className="metas-resumen-card">
              <span>Metas registradas</span>
              <strong>{metas.length}</strong>
            </article>

            <article className="metas-resumen-card">
              <span>Total de objetivos</span>
              <strong>{moneda.format(totalObjetivo)}</strong>
            </article>

            <article className="metas-resumen-card">
              <span>Total ahorrado</span>
              <strong>{moneda.format(totalAhorrado)}</strong>
            </article>
          </div>

          <section className="metas-panel">
            <div className="metas-panel-titulo">
              <div>
                <h2>Crear una meta</h2>
                <p>Define cuánto necesitas y para cuándo.</p>
              </div>
              <Plus size={22} />
            </div>

            <form className="metas-formulario" onSubmit={crearMeta}>
              <label>
                Nombre de la meta
                <input
                  name="nombre"
                  value={formulario.nombre}
                  onChange={cambiarCampo}
                  placeholder="Ej. Viaje, emergencia, automóvil"
                  required
                />
              </label>

              <label>
                Monto objetivo (MXN)
                <input
                  type="number"
                  name="monto_objetivo"
                  min="0.01"
                  step="0.01"
                  value={formulario.monto_objetivo}
                  onChange={cambiarCampo}
                  required
                />
              </label>

              <label>
                Ahorro inicial (MXN)
                <input
                  type="number"
                  name="monto_actual"
                  min="0"
                  step="0.01"
                  value={formulario.monto_actual}
                  onChange={cambiarCampo}
                />
              </label>

              <label>
                Fecha objetivo
                <input
                  type="date"
                  name="fecha_objetivo"
                  value={formulario.fecha_objetivo}
                  onChange={cambiarCampo}
                />
              </label>

              <button className="metas-boton principal" type="submit">
                <Plus size={18} />
                Crear meta
              </button>
            </form>
          </section>

          <section className="metas-panel">
            <div className="metas-panel-titulo">
              <div>
                <h2>Mis metas</h2>
                <p>Consulta el progreso de cada objetivo.</p>
              </div>

              <button
                className="metas-boton secundario"
                onClick={cargarDatos}
                type="button"
              >
                <RefreshCw size={16} />
                Actualizar
              </button>
            </div>

            {cargando ? (
              <p className="metas-vacio">Cargando metas...</p>
            ) : metas.length === 0 ? (
              <div className="metas-vacio">
                <PiggyBank size={38} />
                <strong>Aún no tienes metas</strong>
                <span>Crea tu primera meta de ahorro arriba.</span>
              </div>
            ) : (
              <div className="metas-lista">
                {metas.map((meta) => {
                  const objetivo = Number(meta.monto_objetivo || 0);
                  const ahorrado = Number(
                    meta.monto_actual ??
                    meta.monto_ahorrado ??
                    0
                  );
                  const porcentaje = objetivo > 0
                    ? Math.min(100, (ahorrado / objetivo) * 100)
                    : 0;

                  const id = meta.id_meta ?? meta.id;

                  return (
                    <article className="metas-item" key={id}>
                      <div className="metas-item-cabecera">
                        <div className="metas-item-icono">
                          <PiggyBank size={22} />
                        </div>

                        <div className="metas-item-nombre">
                          <h3>{meta.nombre || "Meta de ahorro"}</h3>
                          <span>
                            {meta.fecha_objetivo
                              ? `Objetivo: ${String(meta.fecha_objetivo).slice(0, 10)}`
                              : "Sin fecha objetivo"}
                          </span>
                        </div>

                        <strong>{Math.round(porcentaje)}%</strong>
                      </div>

                      <div className="metas-barra">
                        <div style={{ width: `${porcentaje}%` }} />
                      </div>

                      <div className="metas-cantidades">
                        <span>Ahorrado: {moneda.format(ahorrado)}</span>
                        <span>Objetivo: {moneda.format(objetivo)}</span>
                      </div>

                      <div className="metas-acciones">
                        <button
                          className="metas-boton principal"
                          onClick={() => {
                            setMetaSeleccionada(meta);
                            setMontoAhorro("");
                          }}
                          type="button"
                        >
                          <PiggyBank size={16} />
                          Agregar ahorro
                        </button>

                        <button
                          className="metas-boton peligro"
                          onClick={() => cancelarMeta(meta)}
                          type="button"
                        >
                          <X size={16} />
                          Cancelar meta
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {metaSeleccionada && (
            <div className="metas-modal-fondo">
              <form className="metas-modal" onSubmit={agregarAhorro}>
                <h2>Agregar ahorro</h2>
                <p>
                  Meta: <strong>{metaSeleccionada.nombre}</strong>
                </p>

                <label>
                  Cantidad a ahorrar (MXN)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={montoAhorro}
                    onChange={(e) => setMontoAhorro(e.target.value)}
                    required
                    autoFocus
                  />
                </label>

                <div className="metas-acciones">
                  <button className="metas-boton principal" type="submit">
                    Confirmar ahorro
                  </button>
                  <button
                    className="metas-boton secundario"
                    type="button"
                    onClick={() => setMetaSeleccionada(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
```