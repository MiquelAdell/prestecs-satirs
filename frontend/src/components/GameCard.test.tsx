import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { GameCard } from "./GameCard";
import type { GameWithStatus } from "../types/game";
import type { CurrentMember } from "../types/member";

const mockUseAuth = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../api/client", () => ({
  apiFetch: vi.fn().mockResolvedValue({}),
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

const AVAILABLE_GAME: GameWithStatus = {
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

const LENT_GAME: GameWithStatus = {
  ...AVAILABLE_GAME,
  status: "lent",
  borrower_display_name: "Ada Lovelace",
  loan_id: 42,
};

function renderCard(
  game: GameWithStatus = AVAILABLE_GAME,
  mode: "member" | "public" = "member",
) {
  return render(
    <MemoryRouter>
      <GameCard game={game} onAction={() => undefined} mode={mode} />
    </MemoryRouter>,
  );
}

describe("GameCard", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ member: MEMBER });
  });

  it("renders the cover image with the game name as alt text", () => {
    renderCard();
    const img = screen.getByAltText("Catan") as HTMLImageElement;
    expect(img.src).toBe("https://example.com/catan.jpg");
  });

  it("renders the title, year, players range, and play time", () => {
    renderCard();
    expect(screen.getByRole("heading", { name: "Catan" })).toBeInTheDocument();
    expect(screen.getByText("1995")).toBeInTheDocument();
    expect(screen.getByText("3–4 jugadores")).toBeInTheDocument();
    expect(screen.getByText("90 min")).toBeInTheDocument();
  });

  it("renders the availability badge as Disponible for an available game", () => {
    renderCard(AVAILABLE_GAME);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(screen.queryByText("Prestado")).toBeNull();
  });

  it("renders the availability badge as Prestado for a lent game", () => {
    renderCard(LENT_GAME);
    expect(screen.getByText("Prestado")).toBeInTheDocument();
    expect(screen.queryByText("Disponible")).toBeNull();
    expect(screen.getByText("Prestado a Ada Lovelace")).toBeInTheDocument();
  });

  it("renders the rating badge when bgg_rating > 0", () => {
    renderCard();
    expect(screen.getByText("★ 7.2")).toBeInTheDocument();
  });

  it("hides the rating badge when bgg_rating is 0", () => {
    renderCard({ ...AVAILABLE_GAME, bgg_rating: 0 });
    expect(screen.queryByText(/★/)).toBeNull();
  });

  it("renders Tomar prestado for an authenticated member + available game", () => {
    renderCard(AVAILABLE_GAME);
    expect(
      screen.getByRole("button", { name: "Tomar prestado" }),
    ).toBeInTheDocument();
  });

  it("renders Devolver only when the current member owns the loan", () => {
    renderCard(LENT_GAME);
    expect(screen.getByRole("button", { name: "Devolver" })).toBeInTheDocument();
  });

  it("renders Devolver for any lent game when the current member is admin", () => {
    mockUseAuth.mockReturnValue({ member: ADMIN });
    renderCard({ ...LENT_GAME, borrower_display_name: "Someone Else" });
    expect(screen.getByRole("button", { name: "Devolver" })).toBeInTheDocument();
  });

  it("does not render Devolver when a non-admin views someone else's loan", () => {
    mockUseAuth.mockReturnValue({ member: MEMBER });
    renderCard({ ...LENT_GAME, borrower_display_name: "Someone Else" });
    expect(screen.queryByRole("button", { name: "Devolver" })).toBeNull();
  });

  it("opens the borrow ConfirmDialog when Tomar prestado is clicked", async () => {
    renderCard(AVAILABLE_GAME);
    await userEvent.click(
      screen.getByRole("button", { name: "Tomar prestado" }),
    );
    expect(
      screen.getByText('¿Quieres tomar prestado "Catan"?'),
    ).toBeInTheDocument();
  });

  it("hides every action button when mode is public", () => {
    renderCard(AVAILABLE_GAME, "public");
    expect(screen.queryByRole("button", { name: "Tomar prestado" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Devolver" })).toBeNull();
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("hides every action button for an unauthenticated visitor in member mode", () => {
    mockUseAuth.mockReturnValue({ member: null });
    renderCard(AVAILABLE_GAME);
    expect(screen.queryByRole("button", { name: "Tomar prestado" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Devolver" })).toBeNull();
  });
});
