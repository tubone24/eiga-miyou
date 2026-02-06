export type TheaterChain = "toho" | "aeon" | "cinema109" | "other";

export interface Theater {
  id: string;
  name: string;
  chain: TheaterChain;
  address: string;
  lat: number;
  lng: number;
  placeId?: string; // Google Maps Place ID
  distanceMeters?: number;
  durationMinutes?: number;
}

export interface ShowTime {
  theaterId: string;
  theaterName: string;
  movieTitle: string;
  startTime: string; // ISO 8601
  endTime: string;
  screen: string;
  format: string; // "2D" | "3D" | "IMAX" | "4DX" etc.
  availableSeats?: number;
  ticketUrl?: string;
}

export interface TheaterCredential {
  userId: string;
  chain: TheaterChain;
  encryptedData: string;
  iv: string;
  authTag: string;
}
