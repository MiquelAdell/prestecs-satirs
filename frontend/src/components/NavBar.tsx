import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../ui/Button";
import "./NavBar.css";

export function NavBar() {
  const { member, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Refugio del Sátiro</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Catálogo</Link>
        {member && <Link to="/my-loans">Mis préstamos</Link>}
        {member?.is_admin && <Link to="/admin/members">Administración</Link>}
        {member?.is_admin && <Link to="/admin/content">Contenido</Link>}
      </div>
      <div className="navbar-auth">
        {member ? (
          <>
            <span className="navbar-user">{member.display_name}</span>
            <Button variant="secondary" onClick={() => void logout()}>
              Cerrar sesión
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={() => navigate("/login")}>
            Iniciar sesión
          </Button>
        )}
      </div>
    </nav>
  );
}
