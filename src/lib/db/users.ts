import { getDb } from "./index";
import { v4 as uuidv4 } from "uuid";
import type { User, UserAddress } from "@/types/user";

export function upsertUser(data: {
  email: string;
  displayName: string;
  image?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}): User {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(data.email) as { id: string } | undefined;

  if (existing) {
    const updateFields: string[] = [
      "display_name = @displayName",
      "image = @image",
      "updated_at = datetime('now')",
    ];
    const params: Record<string, unknown> = {
      id: existing.id,
      displayName: data.displayName,
      image: data.image ?? null,
    };

    if (data.googleAccessToken !== undefined) {
      updateFields.push("google_access_token = @googleAccessToken");
      params.googleAccessToken = data.googleAccessToken;
    }
    if (data.googleRefreshToken !== undefined) {
      updateFields.push("google_refresh_token = @googleRefreshToken");
      params.googleRefreshToken = data.googleRefreshToken;
    }

    db.prepare(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = @id`
    ).run(params);

    return getUserById(existing.id)!;
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO users (id, email, display_name, image, google_access_token, google_refresh_token)
     VALUES (@id, @email, @displayName, @image, @googleAccessToken, @googleRefreshToken)`
  ).run({
    id,
    email: data.email,
    displayName: data.displayName,
    image: data.image ?? null,
    googleAccessToken: data.googleAccessToken ?? null,
    googleRefreshToken: data.googleRefreshToken ?? null,
  });

  return getUserById(id)!;
}

export function getUserById(id: string): User | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapRowToUser(row);
}

export function getUserByEmail(email: string): User | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapRowToUser(row);
}

export function updateUserTokens(
  userId: string,
  accessToken: string,
  refreshToken?: string
): void {
  const db = getDb();
  if (refreshToken) {
    db.prepare(
      `UPDATE users SET google_access_token = ?, google_refresh_token = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(accessToken, refreshToken, userId);
  } else {
    db.prepare(
      `UPDATE users SET google_access_token = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(accessToken, userId);
  }
}

export function getUserAddresses(userId: string): UserAddress[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC")
    .all(userId) as Record<string, unknown>[];
  return rows.map(mapRowToAddress);
}

export function upsertAddress(
  userId: string,
  data: Omit<UserAddress, "id" | "userId">
): UserAddress {
  const db = getDb();

  if (data.isDefault) {
    db.prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?").run(userId);
  }

  const existing = db
    .prepare("SELECT id FROM user_addresses WHERE user_id = ? AND label = ?")
    .get(userId, data.label) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE user_addresses SET prefecture = ?, city = ?, street = ?, postal_code = ?, lat = ?, lng = ?, is_default = ? WHERE id = ?`
    ).run(data.prefecture, data.city, data.street, data.postalCode ?? null, data.lat ?? null, data.lng ?? null, data.isDefault ? 1 : 0, existing.id);
    return { ...data, id: existing.id, userId };
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO user_addresses (id, user_id, label, postal_code, prefecture, city, street, lat, lng, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, data.label, data.postalCode ?? null, data.prefecture, data.city, data.street, data.lat ?? null, data.lng ?? null, data.isDefault ? 1 : 0);

  return { ...data, id, userId };
}

export function deleteAddress(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM user_addresses WHERE id = ?").run(id);
}

function mapRowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string,
    image: row.image as string | undefined,
    googleAccessToken: row.google_access_token as string | undefined,
    googleRefreshToken: row.google_refresh_token as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRowToAddress(row: Record<string, unknown>): UserAddress {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    label: row.label as UserAddress["label"],
    postalCode: row.postal_code as string | undefined,
    prefecture: row.prefecture as string,
    city: row.city as string,
    street: row.street as string,
    lat: row.lat as number | undefined,
    lng: row.lng as number | undefined,
    isDefault: Boolean(row.is_default),
  };
}
