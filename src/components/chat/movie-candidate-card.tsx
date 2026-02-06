"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Train } from "lucide-react";

interface MovieCandidate {
  theaterName: string;
  chain: string;
  startTime: string;
  endTime: string;
  format: string;
  travelMinutes: number;
  movieTitle: string;
}

interface MovieCandidateCardProps {
  candidate: MovieCandidate;
  onSelect: (candidate: MovieCandidate) => void;
  selected?: boolean;
}

export function MovieCandidateCard({
  candidate,
  onSelect,
  selected = false,
}: MovieCandidateCardProps) {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        selected
          ? "ring-2 ring-neutral-900 bg-neutral-50"
          : "hover:bg-neutral-50"
      }`}
      onClick={() => onSelect(candidate)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-medium text-sm text-neutral-900">
              {candidate.theaterName}
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              {candidate.movieTitle}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {candidate.format}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-neutral-600">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(candidate.startTime)} 〜 {formatTime(candidate.endTime)}
          </span>
          <span className="flex items-center gap-1">
            <Train className="h-3.5 w-3.5" />
            {candidate.travelMinutes}分
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
