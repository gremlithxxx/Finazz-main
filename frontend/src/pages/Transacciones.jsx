
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  PlusCircle,
  Wallet,
  AlertCircle,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";
import {
  cerrarSesion,
  obtenerPerfil,
} from "../services/authService";

import "./Transacciones.css";

const FRECUENCIAS = [
  "Diario",
  "Semanal",
  "Quincenal",
  "Mensual",
  "Anual",
];

const formatoDinero = (valor) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(valor) || 0);

function Transacciones() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("Usuario");
  const [tipoFormulario, setTipoFormulario] = useState("ingreso");
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const [formulario, setFormulario] = useState({
    concepto: "",
    categoria: "",
    descripcion: "",
    monto: "",
    tipo: "Variable",
    frecuencia: "Mensual",
  });

  const cargarDatos = useCallback(async (mostrarCarga = true) => {
    if (mostrarCarga) setCargando(true);
    setError("");

    try {
      const [respuestaIngresos, respuestaGastos] =
        await Promise.all([
          api.get("/ingresos"),
          api.get("/gastos"),
        ]);

      setIngresos(respuestaIngresos.data.ingresos || []);
      setGastos(respuestaGastos.data.gastos || []);
    } catch (err) {
      console.error("Error al cargar movimientos:", err);

      if (err.response?.status === 401) {
        cerrarSesion();
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.mensaje ||
          "No se pudieron cargar los movimientos. Verifica que el backend esté encendido."
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [navigate]);

  useEffect(() => {
    let activo = true;

    obtenerPerfil()
      .then((usuario) => {
        if (activo && usuario) {
          setNombre(
            usuario.nombre ||
              usuario.nombre_usuario ||
              usuario.correo ||
              "Usuario"
          );
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          cerrarSesion();
          navigate("/login", { replace: true });
        }
      });

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [cargarDatos, navigate]);

  const cambiarCampo = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setError("");
    setMensaje("");
  };

  const cambiarTipoFormulario = (tipo) => {
    setTipoFormulario(tipo);
    setError("");
    setMensaje("");
  };

  const enviarFormulario = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    const monto = Number(formulario.monto);

    if (!Number.isFinite(monto) || monto <= 0) {
      setError("Ingresa un monto mayor que cero.");
      return;
    }

    if (Math.round(monto * 100) !== monto * 100) {
      setError("El monto solo puede tener dos decimales.");
      return;
    }

    if (tipoFormulario === "ingreso" && !formulario.concepto.trim()) {
      setError("Escribe el concepto del ingreso.");
      return;
    }

    if (tipoFormulario === "gasto" && !formulario.categoria.trim()) {
      setError("Escribe la categoría del gasto.");
      return;
    }

    const datos =
      tipoFormulario === "ingreso"
        ? {
            concepto: formulario.concepto.trim(),
            monto,
            frecuencia: formulario.frecuencia,
          }
        : {
            categoria: formulario.categoria.trim(),
            descripcion: formulario.descripcion.trim(),
            monto,
            tipo: formulario.tipo,
            frecuencia: formulario.frecuencia,
          };

    setGuardando(true);

    try {
      const endpoint =
        tipoFormulario === "ingreso" ? "/ingresos" : "/gastos";

      const respuesta = await api.post(endpoint, datos);

      setMensaje(
        respuesta.data?.mensaje ||
          (tipoFormulario === "ingreso"
            ? "Ingreso registrado correctamente."
            : "Gasto registrado correctamente.")
      );

      setFormulario({
        concepto: "",
        categoria: "",
        descripcion: "",
        monto: "",
        tipo: "Variable",
        frecuencia: "Mensual",
      });

      await cargarDatos(false);
    } catch (err) {
      console.error("Error al guardar movimiento:", err);

      if (err.response?.status === 401) {
        cerrarSesion();
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.mensaje ||
          "No se pudo guardar el movimiento. Revisa los datos e inténtalo nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  };

  const salir = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  const navegarModulo = (modulo) => {
    if (modulo.id === "dashboard") {
      navigate("/dashboard");
    } else if (modulo.id === "movimientos") {
      navigate("/movimientos");
    } else {
      setMensaje(
        `${modulo.nombre}: conectaremos este módulo en su siguiente fase.`
      );
    }
  };

  const actualizar = async () => {
    setActualizando(true);
    await cargarDatos(false);
  };

  const movimientos = [
    ...ingresos.map((item) => ({
      id: `ingreso-${item.id_ingreso}`,
      concepto: item.concepto || "Ingreso",
      monto: Number(item.monto) || 0,
      frecuencia: item.frecuencia || "—",
      fecha: item.fecha_registro,
      clase: "ingreso",
      etiqueta: "Ingreso",
    })),
    ...gastos.map((item) => ({
      id: `gasto-${item.id_gasto}`,
      concepto: item.categoria || "Gasto",
      descripcion: item.descripcion || "",
      monto: Number(item.monto) || 0,
      frecuencia: item.frecuencia || "—",
      fecha: item.fecha_registro,
      clase: "gasto",
      etiqueta: "Gasto",
    })),
  ].sort((a, b) => {
    const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
    const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
    return fechaB - fechaA;
  });

  const movimientosFiltrados =
    filtro === "todos"
      ? movimientos
      : movimientos.filter((item) => item.clase === filtro);

  const totalIngresos = ingresos.reduce(
    (total, item) => total + (Number(item.monto) || 0),
    0
  );

  const totalGastos = gastos.reduce(
    (total, item) => total + (Number(item.monto) || 0),
    0
  );

  return (
    <div className="transacciones-layout">
      <Sidebar
        activo="movimientos"
        onNavigate={navegarModulo}
        onLogout={salir}
      />

      <main className="transacciones-main">
        <Header nombre={nombre} />

        <section className="transacciones-contenido">
          <div className="transacciones-titulo">
            <div>
              <span className="transacciones-eyebrow">
                CONTROL FINANCIERO
              </span>
              <h1>Ingresos y gastos</h1>
              <p>
                Registra tus movimientos y consulta cómo se mueve tu dinero.
              </p>
            </div>

            <button
              type="button"
              className="transacciones-boton-secundario"
              onClick={actualizar}
              disabled={actualizando || cargando}
            >
              <RefreshCw size={17} />
              {actualizando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          <div className="transacciones-resumen">
            <article className="transacciones-resumen-card">
              <div className="transacciones-resumen-icono ingreso">
                <ArrowUpCircle size={23} />
              </div>
              <span>Total de ingresos registrados</span>
              <strong>{formatoDinero(totalIngresos)}</strong>
              <small>{ingresos.length} movimientos</small>
            </article>

            <article className="transacciones-resumen-card">
              <div className="transacciones-resumen-icono gasto">
                <ArrowDownCircle size={23} />
              </div>
              <span>Total de gastos registrados</span>
              <strong>{formatoDinero(totalGastos)}</strong>
              <small>{gastos.length} movimientos</small>
            </article>

            <article className="transacciones-resumen-card">
              <div className="transacciones-resumen-icono balance">
                <Wallet size={23} />
              </div>
              <span>Diferencia registrada</span>
              <strong>{formatoDinero(totalIngresos - totalGastos)}</strong>
              <small>Ingresos menos gastos</small>
            </article>
          </div>

          {error && (
            <div className="transacciones-alerta error" role="alert">
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>
          )}

          {mensaje && (
            <div className="transacciones-alerta exito" role="status">
              {mensaje}
            </div>
          )}

          <div className="transacciones-columnas">
            <section className="transacciones-panel transacciones-form-panel">
              <div className="transacciones-panel-cabecera">
                <div>
                  <h2>Nuevo movimiento</h2>
                  <p>Completa los datos para registrar una operación.</p>
                </div>
                <PlusCircle size={22} />
              </div>

              <div className="transacciones-tipo-selector">
                <button
                  type="button"
                  className={
                    tipoFormulario === "ingreso" ? "seleccionado ingreso" : ""
                  }
                  onClick={() => cambiarTipoFormulario("ingreso")}
                >
                  <ArrowUpCircle size={18} />
                  Ingreso
                </button>

                <button
                  type="button"
                  className={
                    tipoFormulario === "gasto" ? "seleccionado gasto" : ""
                  }
                  onClick={() => cambiarTipoFormulario("gasto")}
                >
                  <ArrowDownCircle size={18} />
                  Gasto
                </button>
              </div>

              <form onSubmit={enviarFormulario}>
                {tipoFormulario === "ingreso" ? (
                  <div className="transacciones-campo">
                    <label htmlFor="concepto">Concepto del ingreso</label>
                    <input
                      id="concepto"
                      name="concepto"
                      value={formulario.concepto}
                      onChange={cambiarCampo}
                      placeholder="Ej. Sueldo, ventas, freelance"
                      maxLength={150}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="transacciones-campo">
                      <label htmlFor="categoria">Categoría del gasto</label>
                      <input
                        id="categoria"
                        name="categoria"
                        value={formulario.categoria}
                        onChange={cambiarCampo}
                        placeholder="Ej. Alimentación, transporte"
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="transacciones-campo">
                      <label htmlFor="descripcion">
                        Descripción (opcional)
                      </label>
                      <input
                        id="descripcion"
                        name="descripcion"
                        value={formulario.descripcion}
                        onChange={cambiarCampo}
                        placeholder="Detalles del gasto"
                        maxLength={250}
                      />
                    </div>

                    <div className="transacciones-campo">
                      <label htmlFor="tipo">Tipo de gasto</label>
                      <select
                        id="tipo"
                        name="tipo"
                        value={formulario.tipo}
                        onChange={cambiarCampo}
                      >
                        <option value="Fijo">Fijo</option>
                        <option value="Variable">Variable</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="transacciones-campo">
                  <label htmlFor="monto">Monto en pesos mexicanos</label>
                  <div className="transacciones-monto-input">
                    <span>$</span>
                    <input
                      id="monto"
                      name="monto"
                      type="number"
                      min="0.01"
                      max="999999999"
                      step="0.01"
                      value={formulario.monto}
                      onChange={cambiarCampo}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="transacciones-campo">
                  <label htmlFor="frecuencia">Frecuencia</label>
                  <select
                    id="frecuencia"
                    name="frecuencia"
                    value={formulario.frecuencia}
                    onChange={cambiarCampo}
                  >
                    {FRECUENCIAS.map((frecuencia) => (
                      <option key={frecuencia} value={frecuencia}>
                        {frecuencia}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className={`transacciones-guardar ${
                    tipoFormulario === "gasto" ? "guardar-gasto" : ""
                  }`}
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : `Registrar ${tipoFormulario}`}
                </button>
              </form>
            </section>

            <section className="transacciones-panel transacciones-lista-panel">
              <div className="transacciones-panel-cabecera lista">
                <div>
                  <h2>Movimientos registrados</h2>
                  <p>Información consultada desde el servidor.</p>
                </div>
                <span className="transacciones-contador">
                  {movimientos.length}
                </span>
              </div>

              <div className="transacciones-filtros">
                {[
                  { valor: "todos", texto: "Todos" },
                  { valor: "ingreso", texto: "Ingresos" },
                  { valor: "gasto", texto: "Gastos" },
                ].map((opcion) => (
                  <button
                    type="button"
                    key={opcion.valor}
                    className={filtro === opcion.valor ? "activo" : ""}
                    onClick={() => setFiltro(opcion.valor)}
                  >
                    {opcion.texto}
                  </button>
                ))}
              </div>

              {cargando ? (
                <div className="transacciones-vacio">
                  Cargando movimientos...
                </div>
              ) : movimientosFiltrados.length === 0 ? (
                <div className="transacciones-vacio">
                  <Wallet size={34} />
                  <strong>No hay movimientos para mostrar</strong>
                  <span>
                    Registra un ingreso o un gasto para comenzar.
                  </span>
                </div>
              ) : (
                <div className="transacciones-tabla-contenedor">
                  <table className="transacciones-tabla">
                    <thead>
                      <tr>
                        <th>Movimiento</th>
                        <th>Frecuencia</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientosFiltrados.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="transacciones-movimiento-nombre">
                              <span className={`movimiento-icono ${item.clase}`}>
                                {item.clase === "ingreso" ? (
                                  <ArrowUpCircle size={18} />
                                ) : (
                                  <ArrowDownCircle size={18} />
                                )}
                              </span>
                              <div>
                                <strong>{item.concepto}</strong>
                                <small>
                                  {item.etiqueta}
                                  {item.fecha
                                    ? ` · ${new Date(item.fecha).toLocaleDateString("es-MX")}`
                                    : ""}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>{item.frecuencia}</td>
                          <td className={`monto-${item.clase}`}>
                            {item.clase === "ingreso" ? "+" : "−"}
                            {formatoDinero(item.monto)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Transacciones;
