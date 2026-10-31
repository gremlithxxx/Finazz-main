```jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, Mail, ShieldCheck, LogOut, RefreshCw } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { obtenerPerfil, cerrarSesion } from "../services/authService";
import "./Perfil.css";

export default function Perfil() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarPerfil() {
    setCargando(true);
    setError("");
    try {
      const datos = await obtenerPerfil();
      setUsuario(datos?.usuario || datos);
    } catch (e) {
      setError(
        e.response?.data?.mensaje ||
        "No se pudo obtener el perfil. Vuelve a iniciar sesión si tu sesión expiró."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarPerfil(); }, []);

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

  const nombre =
    usuario?.nombre ||
    usuario?.nombre_usuario ||
    usuario?.nombre_completo ||
    "Usuario";

  const correo = usuario?.correo || usuario?.email || "No disponible";
  const idUsuario = usuario?.id_usuario ?? usuario?.id;

  return (
    <div className="perfil-layout">
      <Sidebar moduloActivo="configuracion" activeModule="configuracion" onNavigate={navegar} onLogout={salir} />
      <main className="perfil-main">
        <Header nombre={nombre} />
        <div className="perfil-contenido">
          <header className="perfil-hero">
            <div>
              <span className="perfil-eyebrow">TU CUENTA FINAZZ</span>
              <h1>Perfil y configuración</h1>
              <p>Consulta los datos asociados a tu cuenta.</p>
            </div>
            <div className="perfil-hero-icon"><UserRound size={30} /></div>
          </header>

          {error && <div className="perfil-alerta">{error}</div>}

          <section className="perfil-tarjeta">
            {cargando ? (
              <div className="perfil-estado">Cargando perfil...</div>
            ) : usuario ? (
              <>
                <div className="perfil-identidad">
                  <div className="perfil-avatar">
                    {String(nombre).trim().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2>{nombre}</h2>
                    <span>Cuenta de FINAZZ</span>
                  </div>
                  <div className="perfil-verificado"><ShieldCheck size={17} /> Sesión activa</div>
                </div>

                <div className="perfil-separador" />

                <div className="perfil-datos">
                  <article>
                    <div className="perfil-dato-icono"><UserRound size={19} /></div>
                    <div><span>Nombre</span><strong>{nombre}</strong></div>
                  </article>

                  <article>
                    <div className="perfil-dato-icono"><Mail size={19} /></div>
                    <div><span>Correo electrónico</span><strong>{correo}</strong></div>
                  </article>

                  {idUsuario !== undefined && (
                    <article>
                      <div className="perfil-dato-icono"><ShieldCheck size={19} /></div>
                      <div><span>Identificador de usuario</span><strong>{idUsuario}</strong></div>
                    </article>
                  )}
                </div>

                <div className="perfil-nota">
                  Tus datos se consultan desde la API de FINAZZ. La edición de información personal
                  requiere un endpoint de actualización en el backend.
                </div>

                <div className="perfil-acciones">
                  <button className="perfil-btn secundario" onClick={cargarPerfil} type="button">
                    <RefreshCw size={17} /> Actualizar datos
                  </button>
                  <button className="perfil-btn peligro" onClick={salir} type="button">
                    <LogOut size={17} /> Cerrar sesión
                  </button>
                </div>
              </>
            ) : (
              <div className="perfil-estado">
                <p>No se pudieron mostrar los datos de la cuenta.</p>
                <button className="perfil-btn principal" onClick={cargarPerfil} type="button">
                  Intentar de nuevo
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
```