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

export interface CalendarBusySlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  summary?: string; // 予定名
}

export interface CalendarData {
  busySlots: CalendarBusySlot[];
  events?: Array<{
    summary: string;
    start: string;
    end: string;
    allDay: boolean;
  }>;
  needsReauth?: boolean;
}
