import { auth } from "@/lib/auth";
import { getUserBookings } from "@/lib/db/bookings";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = getUserBookings(session.user.id);
  return NextResponse.json({ bookings });
}
