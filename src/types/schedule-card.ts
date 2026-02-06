export interface ScheduleShowtime {
  movieTitle?: string;
  startTime: string;
  endTime?: string;
  screen?: string;
  format?: string;
  isAvailable?: boolean;
  ticketUrl?: string;
}

export interface TheaterSchedule {
  theaterId: string;
  theaterName: string;
  showtimes: ScheduleShowtime[];
}

export interface RestaurantInfo {
  name: string;
  address: string;
  rating: number | null;
  priceLevel: string | null;
  types: string[];
  placeId: string;
  photoName: string | null;
}

export interface RestaurantData {
  restaurants: RestaurantInfo[];
  mealType: "lunch" | "dinner";
}
