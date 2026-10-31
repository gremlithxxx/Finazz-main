
import { CalendarDays, Leaf } from "lucide-react";
import "./Header.css";

function Header({ nombre = "Usuario" }) {
  const fecha = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="finazz-header">
      <div className="header-heading">
        <span className="header-eyebrow">TU ESPACIO FINANCIERO</span>
        <h1>Hola, {nombre}</h1>
        <p>Este es el resumen de tus finanzas personales.</p>
      </div>

      <div className="header-right">
        <div className="header-date">
          <CalendarDays size={17} />
          <span>{fecha}</span>
        </div>

        <div className="header-avatar" aria-label="Perfil de usuario">
          <Leaf size={21} />
        </div>
      </div>
    </header>
  );
}

export default Header;
