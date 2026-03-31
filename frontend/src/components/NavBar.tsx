import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import "./NavBar.css";

export function NavBar() {
  const { member, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">{t("nav.brand")}</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">{t("nav.catalog")}</Link>
        {member && <Link to="/my-loans">{t("nav.myLoans")}</Link>}
        {member?.is_admin && <Link to="/admin/members">{t("nav.admin")}</Link>}
      </div>
      <div className="navbar-auth">
        {member ? (
          <>
            <span className="navbar-user">{member.display_name}</span>
            <button className="btn btn-secondary" onClick={() => void logout()}>
              {t("nav.logout")}
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary">
            {t("nav.login")}
          </Link>
        )}
      </div>
    </nav>
  );
}
