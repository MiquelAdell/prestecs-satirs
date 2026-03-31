import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavBar.css";

export function NavBar() {
  const { member, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Prestecs Satyrs</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Catàleg</Link>
        {member && <Link to="/my-loans">Els meus préstecs</Link>}
        {member?.is_admin && <Link to="/admin/members">Administració</Link>}
      </div>
      <div className="navbar-auth">
        {member ? (
          <>
            <span className="navbar-user">{member.display_name}</span>
            <button className="btn btn-secondary" onClick={() => void logout()}>
              Tancar sessió
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Iniciar sessió
          </Link>
        )}
      </div>
    </nav>
  );
}
