import type { ShowTime } from "./theater";

export interface Movie {
  id: number; // TMDb ID
  title: string;
  originalTitle: string;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate: string;
  runtime?: number; // minutes
  voteAverage?: number;
  genres: string[];
}

export interface MovieSearchResult {
  movie: Movie;
  showtimes: ShowTime[];
}

export interface MovieScheduleRequest {
  movieTitle: string;
  date: string; // YYYY-MM-DD
  userLat: number;
  userLng: number;
  radiusKm?: number;
}
