import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NavBar } from "./components/NavBar";
import { CatalogPage } from "./pages/CatalogPage";
import { GameDetailPage } from "./pages/GameDetailPage";
import { MyLoansPage } from "./pages/MyLoansPage";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { SetPasswordPage } from "./pages/SetPasswordPage";
import { AdminMembersPage } from "./pages/AdminMembersPage";
import { AdminContentPage } from "./pages/AdminContentPage";

const isPublicMount =
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/ludoteca");

export default function App() {
  if (isPublicMount) {
    // Read-only catalog at /ludoteca. No NavBar (no member affordances), no
    // AuthProvider needed — but the catalog uses useAuth, so we still mount
    // the provider for the "member is null" baseline.
    return (
      <BrowserRouter basename="/ludoteca">
        <AuthProvider>
          <main>
            <Routes>
              <Route path="/" element={<CatalogPage mode="public" />} />
            </Routes>
          </main>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter basename="/prestamos">
      <AuthProvider>
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<CatalogPage mode="member" />} />
            <Route path="/games/:id" element={<GameDetailPage mode="member" />} />
            <Route path="/my-loans" element={<MyLoansPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />
            <Route path="/admin/members" element={<AdminMembersPage />} />
            <Route path="/admin/content" element={<AdminContentPage />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
