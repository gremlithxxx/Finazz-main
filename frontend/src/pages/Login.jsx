
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { iniciarSesion as loginAPI } from "../services/authService";
import api from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [modo, setModo] = useState("login");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const registrar = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!nombre.trim() || !correo.trim() || !contrasena) {
      setError("Completa todos los campos.");
      return;
    }

    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setCargando(true);

      const respuesta = await api.post("/usuarios/registro", {
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        contrasena,
      });

      setMensaje(
        respuesta.data?.mensaje ||
        "Cuenta creada. Ahora puedes iniciar sesión."
      );
      setModo("login");
      setContrasena("");
      setConfirmar("");
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No se pudo crear la cuenta. Verifica los datos e inténtalo nuevamente."
      );
    } finally {
      setCargando(false);
    }
  };

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!correo.trim() || !contrasena) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    try {
      setCargando(true);
      const usuario = await loginAPI(
        correo.trim().toLowerCase(),
        contrasena
      );

      setMensaje(`¡Bienvenido a FINAZZ, ${usuario.nombre}!`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No se pudo iniciar sesión. Comprueba tus credenciales."
      );
    } finally {
      setCargando(false);
    }
  };

  const esRegistro = modo === "registro";

  return (
    <div className="login-page">
      <section className="login-brand">
        <div className="login-logo">
          <Leaf size={30} />
          <span>FINAZZ</span>
        </div>

        <div className="login-brand-content">
          <span className="login-eyebrow">
            TU BIENESTAR FINANCIERO
          </span>
          <h1>
            Tu dinero,
            <br />
            tu futuro.
          </h1>
          <p>
            Organiza tus finanzas, alcanza tus metas
            y construye la tranquilidad que mereces.
          </p>
          <div className="login-decoration">
            <Leaf size={100} strokeWidth={0.7} />
          </div>
        </div>

        <p className="login-brand-footer">
          FINAZZ · Tu estabilidad financiera, nuestra prioridad.
        </p>
      </section>

      <section className="login-form-section">
        <div className="login-form-container">
          <div className="login-mobile-logo">
            <Leaf size={24} />
            <span>FINAZZ</span>
          </div>

          <span className="login-welcome">
            {esRegistro ? "ÚNETE A FINAZZ" : "BIENVENIDO A FINAZZ"}
          </span>

          <h2>{esRegistro ? "Crea tu cuenta" : "Inicia sesión"}</h2>

          <p className="login-description">
            {esRegistro
              ? "Registra tu cuenta para comenzar a organizar tus finanzas."
              : "Ingresa a tu espacio financiero personal."}
          </p>

          <form onSubmit={esRegistro ? registrar : iniciarSesion}>
            {esRegistro && (
              <>
                <label htmlFor="nombre">Nombre completo</label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </>
            )}

            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              placeholder="tu@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
              maxLength={255}
              required
            />

            <label htmlFor="contrasena">Contraseña</label>
            <div className="login-password">
              <input
                id="contrasena"
                type={mostrar ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete={esRegistro ? "new-password" : "current-password"}
                required
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setMostrar(!mostrar)}
                aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrar ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {esRegistro && (
              <>
                <label htmlFor="confirmar">Confirmar contraseña</label>
                <input
                  id="confirmar"
                  type={mostrar ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </>
            )}

            {error && (
              <p className="login-error" role="alert">{error}</p>
            )}

            {mensaje && (
              <p role="status" style={{ color: "#16804a" }}>
                {mensaje}
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={cargando}
            >
              {cargando ? (
                <span>{esRegistro ? "Creando cuenta..." : "Iniciando sesión..."}</span>
              ) : (
                <>
                  <span>{esRegistro ? "Crear cuenta" : "Iniciar sesión"}</span>
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <p className="login-register">
            {esRegistro ? "¿Ya tienes una cuenta? " : "¿Aún no tienes una cuenta? "}
            <button
              type="button"
              onClick={() => {
                setModo(esRegistro ? "login" : "registro");
                setError("");
                setMensaje("");
                setMostrar(false);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "inherit",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {esRegistro ? "Inicia sesión" : "Crear cuenta"}
            </button>
          </p>

          <p className="login-copyright">
            © 2026 FINAZZ. Todos los derechos reservados.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;
