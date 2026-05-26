import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SiteNavProvider } from "./context/SiteNavProvider";
import { SiteHeader } from "./components/SiteHeader/SiteHeader";

const rootEl = document.getElementById("site-shell-root");
if (rootEl) {
  // On static content-mirror pages there is no React Router handling navigation,
  // so any anchor click inside the shell must trigger a real full-page load.
  // Intercept in the capture phase (before React's synthetic event handlers).
  rootEl.addEventListener(
    "click",
    (e) => {
      const anchor = (e.target as Element).closest("a[href]");
      if (
        anchor instanceof HTMLAnchorElement &&
        !anchor.getAttribute("href")?.startsWith("#")
      ) {
        e.preventDefault();
        window.location.href = anchor.href;
      }
    },
    true,
  );

  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter basename="/prestamos">
        <AuthProvider>
          <SiteNavProvider>
            <SiteHeader />
          </SiteNavProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}
