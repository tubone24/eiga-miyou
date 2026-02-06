"use client";

import Image from "next/image";
import { Star, Clock, Calendar } from "lucide-react";

export interface MovieInfo {
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  runtime: number | null;
  releaseDate: string;
  voteAverage: number;
  genres: Array<{ id: number; name: string }>;
}

export function MovieCard({ movie }: { movie: MovieInfo }) {
  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w300${movie.posterPath}`
    : null;

  const releaseYear = movie.releaseDate?.slice(0, 4) ?? "";

  return (
    <div className="flex gap-4 p-4 rounded-xl bg-white border border-neutral-200/60 shadow-sm animate-fade-in-up">
      {posterUrl && (
        <div className="shrink-0 w-24 h-36 rounded-lg overflow-hidden bg-neutral-100 relative">
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="96px"
            unoptimized
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-serif font-semibold text-neutral-900 text-base leading-tight">
          {movie.title}
        </h3>
        {movie.originalTitle !== movie.title && (
          <p className="text-xs text-neutral-400 mt-0.5">{movie.originalTitle}</p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
          {movie.voteAverage > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              {movie.voteAverage.toFixed(1)}
            </span>
          )}
          {movie.runtime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {movie.runtime}分
            </span>
          )}
          {releaseYear && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {releaseYear}
            </span>
          )}
        </div>

        {movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {movie.genres.map((g) => (
              <span
                key={g.id}
                className="px-2 py-0.5 rounded-full bg-neutral-100 text-[11px] text-neutral-600"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}

        {movie.overview && (
          <p className="text-xs text-neutral-500 mt-2 line-clamp-3 leading-relaxed">
            {movie.overview}
          </p>
        )}
      </div>
    </div>
  );
}
