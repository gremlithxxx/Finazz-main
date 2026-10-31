
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  CreditCard,
  ChartNoAxesCombined,
  Bell,
  Brain,
  Settings,
  LogOut,
  Leaf,
} from "lucide-react";

import "./Sidebar.css";

const modulos = [
  {
    id: "dashboard",
    nombre: "Inicio",
    icono: LayoutDashboard,
    fase: "listo",
  },
  {
    id: "movimientos",
    nombre: "Ingresos y gastos",
    icono: ArrowLeftRight,
    fase: "pendiente",
  },
  {
    id: "presupuestos",
    nombre: "Presupuestos",
    icono: Wallet,
    fase: "pendiente",
  },
  {
    id: "metas",
    nombre: "Metas de ahorro",
    icono: Target,
    fase: "pendiente",
  },
  {
    id: "deudas",
    nombre: "Deudas y tarjetas",
    icono: CreditCard,
    fase: "pendiente",
  },
  {
    id: "reportes",
    nombre: "Reportes financieros",
    icono: ChartNoAxesCombined,
    fase: "pendiente",
  },
  {
    id: "alertas",
    nombre: "Alertas",
    icono: Bell,
    fase: "pendiente",
  },
  {
    id: "analisis",
    nombre: "Análisis inteligente",
    icono: Brain,
    fase: "pendiente",
  },
];

function Sidebar({ activo, onNavigate, onLogout }) {
  return (
    <aside className="finazz-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Leaf size={25} />
        </div>

        <div>
          <div className="sidebar-brand-name">FINAZZ</div>
          <div className="sidebar-brand-caption">
            FINANZAS PERSONALES
          </div>
        </div>
      </div>

      <div className="sidebar-section-label">
        MENÚ PRINCIPAL
      </div>

      <nav className="sidebar-nav" aria-label="Menú principal">
        {modulos.map((modulo) => {
          const Icono = modulo.icono;
          const seleccionado = activo === modulo.id;

          return (
            <button
              key={modulo.id}
              type="button"
              className={`sidebar-link ${
                seleccionado ? "active" : ""
              }`}
              onClick={() => onNavigate(modulo)}
              aria-current={seleccionado ? "page" : undefined}
            >
              <Icono size={19} strokeWidth={1.8} />

              <span>{modulo.nombre}</span>

              {modulo.fase === "pendiente" && (
                <span className="sidebar-soon" title="En desarrollo">
                  ···
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-divider" />

        <button
          type="button"
          className="sidebar-link sidebar-settings"
          onClick={() =>
            onNavigate({
              id: "configuracion",
              nombre: "Configuración",
              fase: "pendiente",
            })
          }
        >
          <Settings size={19} />
          <span>Configuración</span>
        </button>

        <div className="sidebar-security">
          <Leaf size={17} />
          <div>
            <strong>Tus finanzas, tu control</strong>
            <span>Tu espacio personal</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={onLogout}
        >
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
