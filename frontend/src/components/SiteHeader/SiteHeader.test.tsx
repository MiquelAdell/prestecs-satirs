import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { SiteHeader } from "./SiteHeader";
import type { NavItemsState } from "../../hooks/useNavItems";
import type { CurrentMember } from "../../types/member";

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItemsState["items"] = [
  { label: "Inicio", href: "/inicio" },
  { label: "Calendario", href: "/calendario" },
  { label: "Eventos", href: "/eventos" },
];

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("../../hooks/useNavItemsContext", () => ({
  useNavItemsContext: () => mockNavState,
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

let mockNavState: NavItemsState = { items: NAV_ITEMS, status: "ready" };

interface MockAuthState {
  member: CurrentMember | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const mockLogout = vi.fn();
let mockAuthState: MockAuthState = {
  member: null,
  loading: false,
  login: vi.fn(),
  logout: mockLogout,
};

function renderHeader(initialEntry = "/prestamos/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SiteHeader />
    </MemoryRouter>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setGuest() {
  mockAuthState = { ...mockAuthState, member: null };
}

function setMember() {
  mockAuthState = {
    ...mockAuthState,
    member: {
      id: 1,
      email: "user@test.com",
      display_name: "Test User",
      is_admin: false,
    },
  };
}

function setAdmin() {
  mockAuthState = {
    ...mockAuthState,
    member: {
      id: 2,
      email: "admin@test.com",
      display_name: "Admin User",
      is_admin: true,
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SiteHeader", () => {
  beforeEach(() => {
    mockNavState = { items: NAV_ITEMS, status: "ready" };
    mockLogout.mockReset();
    setGuest();
  });

  describe("fetched nav items", () => {
    it("renders all fetched items as plain anchor tags in desktop nav in order", () => {
      const { container } = renderHeader();

      // Query within the desktop nav only (not the mobile drawer which also renders items)
      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      expect(desktopNav).not.toBeNull();

      const STATIC_HREFS = ["/inicio", "/calendario", "/eventos"];
      const rendered = Array.from(desktopNav!.querySelectorAll("a"))
        .filter((el) =>
          STATIC_HREFS.includes(el.getAttribute("href") ?? "")
        )
        .map((el) => ({
          label: el.textContent,
          href: el.getAttribute("href"),
        }));

      expect(rendered).toEqual([
        { label: "Inicio", href: "/inicio" },
        { label: "Calendario", href: "/calendario" },
        { label: "Eventos", href: "/eventos" },
      ]);
    });

    it("renders only the Préstamos parent when status is error", () => {
      mockNavState = { items: [], status: "error" };
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      expect(desktopNav).not.toBeNull();

      const navLinks = Array.from(desktopNav!.querySelectorAll("a")).map(
        (el) => el.textContent
      );
      expect(navLinks).not.toContain("Inicio");
      expect(navLinks).not.toContain("Calendario");
    });

    it("renders only the Préstamos parent when items is empty with ready status", () => {
      mockNavState = { items: [], status: "ready" };
      const { container } = renderHeader();

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      // Get only direct children li of the top-level ul (not nested submenu li)
      const topNavList = desktopNav!.querySelector("ul");
      const topLevelItems = Array.from(topNavList!.children).map((li) => {
        const link = li.querySelector(":scope > a, :scope > button");
        return link?.textContent ?? "";
      });
      // With empty items, only Préstamos should be in the top-level nav
      expect(topLevelItems.map((t) => t.trim())).toEqual(["Préstamos"]);
    });
  });

  describe("Préstamos submenu — guest", () => {
    it("renders Préstamos as a plain link with no submenu and no chevron", () => {
      setGuest();
      renderHeader();

      // No menuitem roles at all — Préstamos is a plain link, no submenu rendered
      expect(screen.queryAllByRole("menuitem")).toEqual([]);
      // No aria-haspopup anywhere
      expect(
        document.querySelectorAll("[aria-haspopup='menu']").length
      ).toEqual(0);
    });

    it("does not show Mis préstamos, Cerrar sesión, or Administración for guest", () => {
      setGuest();
      renderHeader();

      expect(screen.queryByText("Mis préstamos")).toBeNull();
      expect(screen.queryByText("Cerrar sesión")).toBeNull();
      expect(screen.queryByText("Administración")).toBeNull();
    });

    it("renders the Iniciar sesión action link in the header for guest", () => {
      setGuest();
      const { container } = renderHeader();

      const loginLinks = Array.from(container.querySelectorAll("a")).filter(
        (el) => el.textContent?.trim() === "Iniciar sesión"
      );
      // One in the desktop header actions slot, one in the drawer = 2
      expect(loginLinks.length).toEqual(2);
      loginLinks.forEach((link) => {
        expect(link.getAttribute("href")).toEqual("/login");
      });
    });

    it("does not show Iniciar sesión inside the Préstamos submenu", () => {
      setGuest();
      renderHeader();

      // Iniciar sesión exists in header/drawer (covered above) but never as a menuitem
      const menuitems = screen
        .queryAllByRole("menuitem")
        .map((el) => el.textContent?.trim());
      expect(menuitems).toEqual([]);
    });
  });

  describe("Iniciar sesión action — authenticated users", () => {
    it("is not rendered for member", () => {
      setMember();
      const { container } = renderHeader();

      const loginLinks = Array.from(container.querySelectorAll("a")).filter(
        (el) => el.textContent?.trim() === "Iniciar sesión"
      );
      expect(loginLinks).toEqual([]);
    });

    it("is not rendered for admin", () => {
      setAdmin();
      const { container } = renderHeader();

      const loginLinks = Array.from(container.querySelectorAll("a")).filter(
        (el) => el.textContent?.trim() === "Iniciar sesión"
      );
      expect(loginLinks).toEqual([]);
    });
  });

  describe("Préstamos submenu — member", () => {
    it("renders exactly Mis préstamos, Cerrar sesión for member", () => {
      setMember();
      renderHeader();

      const submenuItems = screen
        .getAllByRole("menuitem")
        .map((el) => el.textContent?.trim());

      expect(submenuItems).toEqual(["Mis préstamos", "Cerrar sesión"]);
    });

    it("does not show Iniciar sesión or Administración for member", () => {
      setMember();
      renderHeader();

      expect(screen.queryByText("Iniciar sesión")).toBeNull();
      expect(screen.queryByText("Administración")).toBeNull();
    });
  });

  describe("Préstamos submenu — admin", () => {
    it("renders Mis préstamos, Administración, Cerrar sesión for admin", () => {
      setAdmin();
      renderHeader();

      const submenuItems = screen
        .getAllByRole("menuitem")
        .map((el) => el.textContent?.trim());

      // Admin sees all items; Administración is a nested parent (not a menuitem) covered by a separate test
      expect(submenuItems).toContain("Mis préstamos");
      expect(submenuItems).toContain("Cerrar sesión");
    });

    it("renders the Administración nested parent for admin", () => {
      setAdmin();
      renderHeader();

      // The nested trigger renders as a button inside a menuitem
      expect(screen.getByText("Administración")).toBeDefined();
    });

    it("renders Miembros and Contenido as nested items for admin", () => {
      setAdmin();
      renderHeader();

      expect(screen.getByText("Miembros")).toBeDefined();
      expect(screen.getByText("Contenido")).toBeDefined();
    });

    it("does not show nested admin items for guest", () => {
      setGuest();
      renderHeader();

      expect(screen.queryByText("Miembros")).toBeNull();
      expect(screen.queryByText("Contenido")).toBeNull();
    });

    it("does not show nested admin items for non-admin member", () => {
      setMember();
      renderHeader();

      expect(screen.queryByText("Miembros")).toBeNull();
      expect(screen.queryByText("Contenido")).toBeNull();
    });
  });

  describe("Cerrar sesión action", () => {
    it("calls logout when Cerrar sesión is clicked", async () => {
      setMember();
      mockLogout.mockResolvedValue(undefined);
      renderHeader();

      const cerrarBtn = screen.getByText("Cerrar sesión");
      fireEvent.click(cerrarBtn);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe("active-route highlighting", () => {
    it("Préstamos parent has active class when at /prestamos/my-loans", () => {
      setMember();
      const { container } = renderHeader("/prestamos/my-loans");

      // Find the Préstamos <Link> element in the desktop nav (not the mobile drawer button)
      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      const prestamosNavItem = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.querySelector("a")?.textContent?.includes("Préstamos")
      );
      expect(prestamosNavItem?.className).toContain("active");
    });

    it("Préstamos parent has active class when at /prestamos/", () => {
      const { container } = renderHeader("/prestamos/");

      const desktopNav = container.querySelector("nav[aria-label='Principal']");
      const prestamosNavItem = Array.from(desktopNav!.querySelectorAll("li")).find(
        (li) => li.querySelector("a")?.textContent?.includes("Préstamos")
      );
      expect(prestamosNavItem?.className).toContain("active");
    });
  });

  describe("mobile burger drawer", () => {
    it("hamburger button is present in the DOM", () => {
      renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      expect(hamburger).toBeDefined();
    });

    it("hamburger starts with aria-expanded false", () => {
      renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      expect(hamburger.getAttribute("aria-expanded")).toEqual("false");
    });

    it("clicking hamburger opens the drawer and sets aria-expanded true", () => {
      renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      expect(hamburger.getAttribute("aria-expanded")).toEqual("true");
    });

    it("clicking hamburger twice closes the drawer", () => {
      renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);
      fireEvent.click(hamburger);

      expect(hamburger.getAttribute("aria-expanded")).toEqual("false");
    });

    it("Escape closes the drawer", () => {
      renderHeader();

      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);
      expect(hamburger.getAttribute("aria-expanded")).toEqual("true");

      fireEvent.keyDown(document, { key: "Escape" });
      expect(hamburger.getAttribute("aria-expanded")).toEqual("false");
    });

    it("tapping Préstamos in drawer toggles prestamos submenu", () => {
      setMember();
      renderHeader();

      // Open drawer first
      const hamburger = screen.getByRole("button", { name: "Abrir menú" });
      fireEvent.click(hamburger);

      // There are two "Préstamos" triggers: one in desktop nav (Link), one in drawer (button)
      const prestamosButtons = screen.getAllByRole("button").filter(
        (el) => el.textContent?.includes("Préstamos")
      );
      // The drawer one has aria-haspopup
      const drawerPrestamos = prestamosButtons.find(
        (el) => el.getAttribute("aria-haspopup") === "menu"
      );
      expect(drawerPrestamos).toBeDefined();

      expect(drawerPrestamos!.getAttribute("aria-expanded")).toEqual("false");
      fireEvent.click(drawerPrestamos!);
      expect(drawerPrestamos!.getAttribute("aria-expanded")).toEqual("true");
    });
  });
});
