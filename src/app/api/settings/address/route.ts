import { auth } from "@/lib/auth";
import { getUserAddresses, upsertAddress } from "@/lib/db/users";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = getUserAddresses(session.user.id);
  return NextResponse.json({ addresses });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { label, postalCode, prefecture, city, street, lat, lng, isDefault } =
    body;

  if (!prefecture || !city || !street) {
    return NextResponse.json(
      { error: "prefecture, city, street are required" },
      { status: 400 }
    );
  }

  const saved = upsertAddress(session.user.id, {
    label: label ?? "home",
    postalCode: postalCode ?? undefined,
    prefecture,
    city,
    street,
    lat: lat ?? undefined,
    lng: lng ?? undefined,
    isDefault: isDefault ?? true,
  });

  return NextResponse.json({ address: saved });
}
