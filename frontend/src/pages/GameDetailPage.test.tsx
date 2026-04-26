import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { GameDetailPage } from "./GameDetailPage";
import type { GameWithStatus } from "../types/game";
import type { LoanHistoryEntry as LoanHistoryEntryType } from "../types/loan";
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

const ADMIN: CurrentMember = {
  id: 2,
  display_name: "Charles Babbage",
  email: "charles@example.com",
  is_admin: true,
};

const AVAILABLE: GameWithStatus = {
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

const LENT_BY_ME: GameWithStatus = {
  ...AVAILABLE,
  status: "lent",
  borrower_display_name: "Ada Lovelace",
  loan_id: 42,
};

const LENT_BY_OTHER: GameWithStatus = {
  ...AVAILABLE,
  status: "lent",
  borrower_display_name: "Someone Else",
  loan_id: 43,
};

const HISTORY: readonly LoanHistoryEntryType[] = [
  {
    member_display_name: "Ada Lovelace",
    borrowed_at: "2025-01-01T00:00:00Z",
    returned_at: "2025-01-08T00:00:00Z",
  },
];

function renderDetailPage(
  game: GameWithStatus,
  mode: "member" | "public" = "member",
) {
  mockApiFetch.mockImplementation((path: string) => {
    if (path === "/games") return Promise.resolve([game]);
    if (path.startsWith("/games/") && path.endsWith("/history")) {
      return Promise.resolve(HISTORY);
    }
    return Promise.resolve({});
  });
  return render(
    <MemoryRouter initialEntries={["/games/1"]}>
      <Routes>
        <Route path="/games/:id" element={<GameDetailPage mode={mode} />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ member: MEMBER });
  mockApiFetch.mockReset();
});

describe("GameDetailPage", () => {
  it("renders title, year, cover, and BGG link", async () => {
    renderDetailPage(AVAILABLE);
    expect(
      await screen.findByRole("heading", { name: "Catan" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1995")).toBeInTheDocument();
    expect(screen.getByAltText("Catan")).toBeInTheDocument();
    const bggLink = screen.getByRole("link", { name: "Ver en BoardGameGeek" });
    expect(bggLink).toHaveAttribute(
      "href",
      "https://boardgamegeek.com/boardgame/100",
    );
  });

  it("renders the prominent Tomar prestado button when member + available", async () => {
    renderDetailPage(AVAILABLE);
    expect(
      await screen.findByRole("button", { name: "Tomar prestado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("opens the borrow ConfirmDialog when Tomar prestado is clicked", async () => {
    renderDetailPage(AVAILABLE);
    const btn = await screen.findByRole("button", { name: "Tomar prestado" });
    await userEvent.click(btn);
    expect(
      screen.getByText('¿Quieres tomar prestado "Catan"?'),
    ).toBeInTheDocument();
  });

  it("renders the Prestado indicator instead of a borrow button when lent", async () => {
    renderDetailPage(LENT_BY_OTHER);
    await screen.findByRole("heading", { name: "Catan" });
    expect(screen.queryByRole("button", { name: "Tomar prestado" })).toBeNull();
    expect(
      screen.getByLabelText("Estado del juego: prestado"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Actualmente prestado a Someone Else"),
    ).toBeInTheDocument();
  });

  it("renders Devolver only when the current member is the lender", async () => {
    renderDetailPage(LENT_BY_ME);
    expect(
      await screen.findByRole("button", { name: "Devolver" }),
    ).toBeInTheDocument();
  });

  it("renders Devolver for any lent game when current member is admin", async () => {
    mockUseAuth.mockReturnValue({ member: ADMIN });
    renderDetailPage(LENT_BY_OTHER);
    expect(
      await screen.findByRole("button", { name: "Devolver" }),
    ).toBeInTheDocument();
  });

  it("does not render Devolver when a non-admin views someone else's loan", async () => {
    renderDetailPage(LENT_BY_OTHER);
    await screen.findByRole("heading", { name: "Catan" });
    expect(screen.queryByRole("button", { name: "Devolver" })).toBeNull();
  });

  it("renders Iniciar sesión link in mode=public for an available game", async () => {
    renderDetailPage(AVAILABLE, "public");
    await screen.findByRole("heading", { name: "Catan" });
    const link = screen.getByRole("link", {
      name: "Iniciar sesión para tomar prestado",
    });
    expect(link).toHaveAttribute("href", "/prestamos/login");
    expect(screen.queryByRole("button", { name: "Tomar prestado" })).toBeNull();
  });

  it("renders Iniciar sesión link for an unauthenticated visitor in member mode (available game)", async () => {
    mockUseAuth.mockReturnValue({ member: null });
    renderDetailPage(AVAILABLE);
    await screen.findByRole("heading", { name: "Catan" });
    const link = screen.getByRole("link", {
      name: "Iniciar sesión para tomar prestado",
    });
    expect(link).toHaveAttribute("href", "/prestamos/login");
    expect(screen.queryByRole("button", { name: "Tomar prestado" })).toBeNull();
  });

  it("renders the loan history list", async () => {
    renderDetailPage(AVAILABLE);
    expect(
      await screen.findByRole("heading", { name: "Historial de préstamos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("renders the empty-history message when there are no entries", async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path === "/games") return Promise.resolve([AVAILABLE]);
      if (path.startsWith("/games/")) return Promise.resolve([]);
      return Promise.resolve({});
    });
    render(
      <MemoryRouter initialEntries={["/games/1"]}>
        <Routes>
          <Route path="/games/:id" element={<GameDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByText("Este juego nunca ha sido prestado."),
    ).toBeInTheDocument();
  });
});
