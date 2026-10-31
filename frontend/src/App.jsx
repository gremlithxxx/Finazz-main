```jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transacciones from "./pages/Transacciones";
import Presupuestos from "./pages/Presupuestos";
import Metas from "./pages/Metas";
import Deudas from "./pages/Deudas";
import Reportes from "./pages/Reportes";
import Perfil from "./pages/Perfil";

import { obtenerToken } from "./services/authService";
import "./styles/variables.css";

function RutaProtegida({ children }) {
  return obtenerToken()
    ? children
    : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={obtenerToken() ? "/dashboard" : "/login"}
              replace
            />
          }
        />

        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={<RutaProtegida><Dashboard /></RutaProtegida>}
        />

        <Route
          path="/movimientos"
          element={<RutaProtegida><Transacciones /></RutaProtegida>}
        />

        <Route
          path="/presupuestos"
          element={<RutaProtegida><Presupuestos /></RutaProtegida>}
        />

        <Route
          path="/metas"
          element={<RutaProtegida><Metas /></RutaProtegida>}
        />

        <Route
          path="/deudas"
          element={<RutaProtegida><Deudas /></RutaProtegida>}
        />

        <Route
          path="/reportes"
          element={<RutaProtegida><Reportes /></RutaProtegida>}
        />

        <Route
          path="/perfil"
          element={<RutaProtegida><Perfil /></RutaProtegida>}
        />

        <Route
          path="*"
          element={
            <Navigate
              to={obtenerToken() ? "/dashboard" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```