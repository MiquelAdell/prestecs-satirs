import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CatalogPage } from "./CatalogPage";
import type { GameWithStatus } from "../types/game";
import type { CurrentMember } from "../types/member";

const mockUseAuth = vi.fn();
const mockApiFetch = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../api/client", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

const MEMBER: CurrentMember = {
  id: 1,
  display_name: "Ada Lovelace",
  email: "ada@example.com",
  is_admin: false,
};

const CATAN: GameWithStatus = {
  id: 1,
  bgg_id: 100,
  name: "Catan",
  thumbnail_url: "https://example.com/catan.jpg",
  image_url: "https://example.com/catan-large.jpg",
  year_published: 1995,
  min_players: 3,
  max_players: 4,
  playing_time: 90,
  bgg_rating: 7.2,
  location: "armari",
  status: "available",
  borrower_display_name: null,
  loan_id: null,
};

const PANDEMIC: GameWithStatus = {
  id: 2,
  bgg_id: 200,
  name: "Pandemic",
  thumbnail_url: "https://example.com/pandemic.jpg",
  image_url: "https://example.com/pandemic-large.jpg",
  year_published: 2008,
  min_players: 2,
  max_players: 4,
  playing_time: 45,
  bgg_rating: 7.6,
  location: "soterrani",
  status: "lent",
  borrower_display_name: "Charles Babbage",
  loan_id: 5,
};

const AZUL: GameWithStatus = {
  id: 3,
  bgg_id: 300,
  name: "Azul",
  thumbnail_url: "",
  image_url: "",
  year_published: 2017,
  min_players: 2,
  max_players: 4,
  playing_time: 40,
  bgg_rating: 7.8,
  location: "armari",
  status: "available",
  borrower_display_name: null,
  loan_id: null,
};

const ALL_GAMES: readonly GameWithStatus[] = [CATAN, PANDEMIC, AZUL];

function renderCatalog(mode: "member" | "public" = "member") {
  return render(
    <MemoryRouter>
      <CatalogPage mode={mode} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ member: MEMBER });
  mockApiFetch.mockReset();
  mockApiFetch.mockResolvedValue(ALL_GAMES);
  // Default to desktop layout for predictable test rendering.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(min-width: 1024px)",
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

describe("CatalogPage", () => {
  it("renders one card per loaded game", async () => {
    renderCatalog();
    expect(
      await screen.findByRole("heading", { name: "Catan" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pandemic" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Azul" })).toBeInTheDocument();
  });

  it("does not render a chip row when every filter is at its default", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Catan" });
    expect(screen.queryByRole("list", { name: "Filtros activos" })).toBeNull();
  });

  it("renders a chip when the user filters by Disponible and clears it on chip close", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Catan" });
    await userEvent.click(screen.getByRole("button", { name: "Disponible" }));

    const chipRow = screen.getByRole("list", { name: "Filtros activos" });
    expect(within(chipRow).getByText("Disponibles")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pandemic" })).toBeNull();

    await userEvent.click(
      within(chipRow).getByRole("button", { name: "Quitar filtro" }),
    );
    expect(screen.queryByRole("list", { name: "Filtros activos" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Pandemic" })).toBeInTheDocument();
  });

  it("filters by location through the Armario chip", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Catan" });
    await userEvent.click(screen.getByRole("button", { name: "Armario" }));
    expect(screen.queryByRole("heading", { name: "Pandemic" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Catan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Azul" })).toBeInTheDocument();
  });

  it("sorts cards by name ascending and descending via the sort dropdown", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Catan" });
    let headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual(["Azul", "Catan", "Pandemic"]);

    await userEvent.click(
      screen.getByRole("button", { name: /Nombre \(A-Z\)/ }),
    );
    await userEvent.click(
      screen.getByRole("option", { name: /Nombre \(Z-A\)/ }),
    );
    headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual(["Pandemic", "Catan", "Azul"]);
  });

  it("hides Borrow buttons and shows Iniciar sesión link in mode=public", async () => {
    renderCatalog("public");
    await screen.findByRole("heading", { name: "Catan" });
    expect(screen.queryAllByRole("button", { name: "Tomar prestado" })).toHaveLength(0);
    const loginLink = screen.getByRole("link", { name: "Iniciar sesión" });
    expect(loginLink).toHaveAttribute("href", "/prestamos/login");
    expect(
      screen.getByRole("heading", { name: "Ludoteca del Refugio" }),
    ).toBeInTheDocument();
  });

  it("renders the player range slider with formatted current values", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Catan" });
    expect(screen.getByText("Jugadores")).toBeInTheDocument();
    // Initial range covers the full bounds [1, 12]; max is shown as 12+.
    expect(screen.getByText("1 – 12+")).toBeInTheDocument();
  });
});
