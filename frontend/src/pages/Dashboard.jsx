
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Target,
  RefreshCw,
  CircleHelp,
  Sparkles,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import api from "../services/api";
import {
  cerrarSesion,
  obtenerPerfil,
} from "../services/authService";
import "./Dashboard.css";

const formatoDinero = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const formatoFecha = (fecha) => {
  if (!fecha) return "Fecha no disponible";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "Fecha no disponible";
  }

  return valor.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Dashboard() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("Usuario");
  const [moduloActivo, setModuloActivo] = useState("dashboard");
  const [aviso, setAviso] = useState("");
  const [actualizando, setActualizando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorDatos, setErrorDatos] = useState("");

  const [balance, setBalance] = useState({
    ingresos: 0,
    gastos: 0,
    disponible: 0,
  });

  const [metas, setMetas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  const cargarDatos = useCallback(async () => {
    setActualizando(true);
    setErrorDatos("");

    try {
      const resultados = await Promise.all([
        api.get("/balance"),
        api.get("/ingresos"),
        api.get("/gastos"),
        api.get("/metas"),
      ]);

      const datosBalance = resultados[0].data;
      const listaIngresos = resultados[1].data.ingresos || [];
      const listaGastos = resultados[2].data.gastos || [];
      const listaMetas = resultados[3].data.metas || [];

      setBalance({
        ingresos: Number(datosBalance.total_ingresos) || 0,
        gastos: Number(datosBalance.total_gastos) || 0,
        disponible: Number(datosBalance.balance) || 0,
      });

      setMetas(listaMetas);

      const ingresosFormateados = listaIngresos.map((item) => ({
        id: `ingreso-${item.id_ingreso}`,
        concepto: item.concepto || "Ingreso",
        monto: Number(item.monto) || 0,
        fecha: item.fecha_registro,
        tipo: "ingreso",
      }));

      const gastosFormateados = listaGastos.map((item) => ({
        id: `gasto-${item.id_gasto}`,
        concepto: item.descripcion || item.categoria || "Gasto",
        monto: Number(item.monto) || 0,
        fecha: item.fecha_registro,
        tipo: "gasto",
      }));

      const listaMovimientos = [
        ...ingresosFormateados,
        ...gastosFormateados,
      ].sort((a, b) => {
        const fechaA = new Date(a.fecha || 0).getTime();
        const fechaB = new Date(b.fecha || 0).getTime();
        return fechaB - fechaA;
      });

      setMovimientos(listaMovimientos.slice(0, 5));
    } catch (error) {
      console.error("Error al cargar el dashboard:", error);

      if (error.response?.status === 401) {
        cerrarSesion();
        navigate("/login", { replace: true });
        return;
      }

      setErrorDatos(
        "No pudimos cargar tus datos financieros. Verifica que el backend esté funcionando e inténtalo de nuevo."
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [navigate]);

  useEffect(() => {
    let activo = true;

    async function iniciarDashboard() {
      try {
        const usuario = await obtenerPerfil();

        if (activo && usuario?.nombre) {
          setNombre(usuario.nombre);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          cerrarSesion();
          navigate("/login", { replace: true });
          return;
        }

        console.error("No se pudo cargar el perfil:", error);
      }

      if (activo) {
        await cargarDatos();
      }
    }

    iniciarDashboard();

    return () => {
      activo = false;
    };
  }, [cargarDatos, navigate]);

  const salir = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

const seleccionarModulo = (modulo) => {
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

  const ruta = rutas[modulo.id];

  if (ruta) {
    navigate(ruta);
  }
};

  const tarjetas = [
    {
      titulo: "Saldo disponible",
      valor: formatoDinero.format(balance.disponible),
      icono: Wallet,
      detalle: "Ingresos menos gastos acumulados",
    },
    {
      titulo: "Ingresos totales",
      valor: formatoDinero.format(balance.ingresos),
      icono: ArrowDownLeft,
      detalle: "Todos tus ingresos registrados",
    },
    {
      titulo: "Gastos totales",
      valor: formatoDinero.format(balance.gastos),
      icono: ArrowUpRight,
      detalle: "Todos tus gastos registrados",
    },
    {
      titulo: "Metas en progreso",
      valor: String(
        metas.filter((meta) => meta.estado === "En progreso").length
      ),
      icono: Target,
      detalle: `${metas.length} metas registradas en total`,
    },
  ];

  return (
    <div className="finazz-app">
      <Sidebar
        activo={moduloActivo}
        onNavigate={seleccionarModulo}
        onLogout={salir}
      />

      <main className="finazz-main">
        <Header nombre={nombre} />

        {aviso ? (
          <section className="module-notice">
            <div className="module-notice-icon">
              <CircleHelp size={24} />
            </div>
            <div>
              <h2>
                {moduloActivo === "configuracion"
                  ? "Configuración"
                  : "Módulo en preparación"}
              </h2>
              <p>{aviso}</p>
              <button
                type="button"
                className="back-dashboard"
                onClick={() =>
                  seleccionarModulo({ id: "dashboard" })
                }
              >
                Volver al inicio
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="dashboard-welcome">
              <div>
                <span className="welcome-label">
                  TU TRANQUILIDAD EMPIEZA AQUÍ
                </span>
                <h2>Un paso más cerca de tus metas.</h2>
                <p>
                  Conoce el estado de tus finanzas y toma decisiones
                  con mayor claridad.
                </p>
              </div>

              <div className="welcome-decoration">
                <Sparkles size={25} />
              </div>
            </section>

            <div className="dashboard-section-heading">
              <div>
                <h2>Resumen financiero</h2>
                <p>Una vista general de tu actividad registrada.</p>
              </div>

              <button
                type="button"
                className="refresh-button"
                onClick={cargarDatos}
                disabled={actualizando}
              >
                <RefreshCw
                  size={15}
                  className={
                    actualizando ? "refresh-spinning" : ""
                  }
                />
                {actualizando ? "Actualizando..." : "Actualizar datos"}
              </button>
            </div>

            {errorDatos && (
              <div
                role="alert"
                style={{
                  padding: "14px 16px",
                  marginBottom: "18px",
                  borderRadius: "12px",
                  background: "#fff0ed",
                  color: "#9f3328",
                }}
              >
                <p style={{ margin: "0 0 10px" }}>{errorDatos}</p>
                <button
                  type="button"
                  className="back-dashboard"
                  onClick={cargarDatos}
                >
                  Intentar de nuevo
                </button>
              </div>
            )}

            <section className="dashboard-cards">
              {tarjetas.map((tarjeta) => {
                const Icono = tarjeta.icono;

                return (
                  <article
                    className="summary-card"
                    key={tarjeta.titulo}
                  >
                    <div className="summary-card-top">
                      <span>{tarjeta.titulo}</span>
                      <div className="summary-icon">
                        <Icono size={19} />
                      </div>
                    </div>

                    <div className="summary-amount">
                      {cargando ? "Cargando..." : tarjeta.valor}
                    </div>

                    <p>{tarjeta.detalle}</p>
                    <span className="data-pending">
                      {cargando
                        ? "Consultando información"
                        : errorDatos
                          ? "No se pudo actualizar"
                          : "Datos de tu cuenta"}
                    </span>
                  </article>
                );
              })}
            </section>

            <section className="dashboard-lower-grid">
              <article className="dashboard-panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Actividad financiera</h2>
                    <p>Tus cinco movimientos más recientes.</p>
                  </div>
                  <TrendingUp size={19} />
                </div>

                {cargando ? (
                  <div className="empty-state">
                    <p>Cargando movimientos...</p>
                  </div>
                ) : movimientos.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Wallet size={25} />
                    </div>
                    <h3>Aún no hay movimientos para mostrar</h3>
                    <p>
                      Cuando registres ingresos o gastos,
                      aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      paddingTop: "12px",
                    }}
                  >
                    {movimientos.map((movimiento) => (
                      <div
                        key={movimiento.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            minWidth: 0,
                          }}
                        >
                          <div className="summary-icon">
                            {movimiento.tipo === "ingreso" ? (
                              <ArrowDownLeft size={18} />
                            ) : (
                              <ArrowUpRight size={18} />
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <strong>{movimiento.concepto}</strong>
                            <p
                              style={{
                                margin: "4px 0 0",
                                fontSize: "12px",
                              }}
                            >
                              <CalendarDays
                                size={12}
                                style={{
                                  display: "inline",
                                  verticalAlign: "middle",
                                  marginRight: "4px",
                                }}
                              />
                              {formatoFecha(movimiento.fecha)}
                            </p>
                          </div>
                        </div>

                        <strong
                          style={{
                            whiteSpace: "nowrap",
                            color:
                              movimiento.tipo === "ingreso"
                                ? "#477c5b"
                                : "#9f5147",
                          }}
                        >
                          {movimiento.tipo === "ingreso" ? "+" : "−"}
                          {formatoDinero.format(movimiento.monto)}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="dashboard-panel goals-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Metas de ahorro</h2>
                    <p>Construye tu futuro, paso a paso.</p>
                  </div>
                  <Target size={19} />
                </div>

                {cargando ? (
                  <div className="goals-message">
                    <p>Cargando tus metas...</p>
                  </div>
                ) : metas.filter(
                    (meta) => meta.estado === "En progreso"
                  ).length === 0 ? (
                  <div className="goals-message">
                    <div className="goals-leaf">
                      <Sparkles size={23} />
                    </div>
                    <h3>Todo comienza con un plan.</h3>
                    <p>
                      Aún no tienes metas en progreso. Cuando
                      registres una meta de ahorro, podrás consultar
                      aquí su avance.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "18px",
                      paddingTop: "12px",
                    }}
                  >
                    {metas
                      .filter((meta) => meta.estado === "En progreso")
                      .slice(0, 4)
                      .map((meta) => {
                        const objetivo =
                          Number(meta.monto_objetivo) || 0;
                        const ahorrado =
                          Number(meta.monto_ahorrado) || 0;
                        const porcentaje = objetivo > 0
                          ? Math.min(
                              100,
                              Math.max(0, (ahorrado / objetivo) * 100)
                            )
                          : 0;

                        return (
                          <div key={meta.id_meta}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "8px",
                                marginBottom: "8px",
                              }}
                            >
                              <strong>{meta.nombre_meta}</strong>
                              <span>
                                {porcentaje.toFixed(0)}%
                              </span>
                            </div>

                            <div
                              style={{
                                height: "8px",
                                borderRadius: "10px",
                                overflow: "hidden",
                                background: "#e9e9e1",
                              }}
                            >
                              <div
                                style={{
                                  width: `${porcentaje}%`,
                                  height: "100%",
                                  borderRadius: "10px",
                                  background: "#9dbb9b",
                                  transition: "width 0.3s ease",
                                }}
                              />
                            </div>

                            <p style={{ marginTop: "7px" }}>
                              {formatoDinero.format(ahorrado)} de{" "}
                              {formatoDinero.format(objetivo)}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </article>
            </section>

            <footer className="dashboard-footer">
              <span>FINAZZ · Tus finanzas, a tu manera.</span>
              <span>Panel personal</span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
