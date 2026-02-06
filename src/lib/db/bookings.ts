import { getDb } from "./index";
import { v4 as uuidv4 } from "uuid";
import type { Booking, BookingStatus } from "@/types/booking";
import type { TheaterChain } from "@/types/theater";

export function createBooking(data: {
  userId: string;
  chain: TheaterChain;
  theaterName: string;
  movieTitle: string;
  showDate: string;
  showTime: string;
  seats: string[];
  ticketType?: string;
}): Booking {
  const db = getDb();
  const id = uuidv4();

  db.prepare(
    `INSERT INTO booking_history (id, user_id, chain, theater_name, movie_title, show_date, show_time, seats, ticket_type, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
  ).run(
    id,
    data.userId,
    data.chain,
    data.theaterName,
    data.movieTitle,
    data.showDate,
    data.showTime,
    JSON.stringify(data.seats),
    data.ticketType ?? null
  );

  return getBookingById(id)!;
}

export function getBookingById(id: string): Booking | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM booking_history WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapRowToBooking(row);
}

export function getUserBookings(userId: string, limit = 20): Booking[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM booking_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(userId, limit) as Record<string, unknown>[];
  return rows.map(mapRowToBooking);
}

export function updateBookingStatus(
  id: string,
  status: BookingStatus,
  calendarEventId?: string
): void {
  const db = getDb();
  if (calendarEventId) {
    db.prepare(
      `UPDATE booking_history SET status = ?, calendar_event_id = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(status, calendarEventId, id);
  } else {
    db.prepare(
      `UPDATE booking_history SET status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(status, id);
  }
}

function mapRowToBooking(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    chain: row.chain as TheaterChain,
    theaterName: row.theater_name as string,
    movieTitle: row.movie_title as string,
    showDate: row.show_date as string,
    showTime: row.show_time as string,
    seats: row.seats as string,
    ticketType: row.ticket_type as string,
    status: row.status as BookingStatus,
    calendarEventId: row.calendar_event_id as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
