export interface Game {
  readonly id: number;
  readonly bgg_id: number;
  readonly name: string;
  readonly thumbnail_url: string;
  readonly year_published: number;
}

export interface GameWithStatus extends Game {
  readonly status: "available" | "lent";
  readonly borrower_display_name: string | null;
  readonly loan_id: number | null;
}
