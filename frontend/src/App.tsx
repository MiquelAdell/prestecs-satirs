import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NavBar } from "./components/NavBar";

function Placeholder({ name }: { readonly name: string }) {
  return <div style={{ padding: "2rem" }}>{name} — pendent d'implementar</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<Placeholder name="Catàleg" />} />
            <Route path="/games/:id" element={<Placeholder name="Detall del joc" />} />
            <Route path="/my-loans" element={<Placeholder name="Els meus préstecs" />} />
            <Route path="/login" element={<Placeholder name="Iniciar sessió" />} />
            <Route path="/set-password" element={<Placeholder name="Establir contrasenya" />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
