import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NavBar } from "./components/NavBar";
import { CatalogPage } from "./pages/CatalogPage";
import { GameDetailPage } from "./pages/GameDetailPage";
import { MyLoansPage } from "./pages/MyLoansPage";
import { LoginPage } from "./pages/LoginPage";
import { SetPasswordPage } from "./pages/SetPasswordPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/games/:id" element={<GameDetailPage />} />
            <Route path="/my-loans" element={<MyLoansPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
