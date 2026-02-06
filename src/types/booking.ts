import type { TheaterChain } from "./theater";

export type BookingStatus =
  | "pending"
  | "seats_selected"
  | "payment_ready"
  | "completed"
  | "cancelled"
  | "failed";

export interface Booking {
  id: string;
  userId: string;
  chain: TheaterChain;
  theaterName: string;
  movieTitle: string;
  showDate: string;
  showTime: string;
  seats: string; // JSON: ["A1", "A2"]
  ticketType: string;
  status: BookingStatus;
  calendarEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingPlan {
  movie: {
    title: string;
    runtime: number;
  };
  theater: {
    name: string;
    chain: TheaterChain;
    address: string;
    travelMinutes: number;
  };
  showtime: {
    startTime: string;
    endTime: string;
    format: string;
  };
  meal?: {
    type: "lunch" | "dinner";
    suggestedTime: string;
    restaurant?: {
      name: string;
      address: string;
      rating: number;
      priceLevel: number;
    };
  };
}
