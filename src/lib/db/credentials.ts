import { getDb } from "./index";
import { encrypt, decrypt } from "@/lib/crypto";
import type { TheaterChain, TheaterCredential } from "@/types/theater";

interface CredentialData {
  username: string;
  password: string;
}

export function saveCredential(
  userId: string,
  chain: TheaterChain,
  data: CredentialData
): void {
  const db = getDb();
  const plaintext = JSON.stringify(data);
  const { encrypted, iv, authTag } = encrypt(plaintext);

  db.prepare(
    `INSERT INTO theater_credentials (user_id, chain, encrypted_data, iv, auth_tag)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, chain) DO UPDATE SET
       encrypted_data = excluded.encrypted_data,
       iv = excluded.iv,
       auth_tag = excluded.auth_tag,
       updated_at = datetime('now')`
  ).run(userId, chain, encrypted, iv, authTag);
}

export function getCredential(
  userId: string,
  chain: TheaterChain
): CredentialData | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM theater_credentials WHERE user_id = ? AND chain = ?")
    .get(userId, chain) as TheaterCredential | undefined;

  if (!row) return null;

  const plaintext = decrypt(row.encryptedData, row.iv, row.authTag);
  return JSON.parse(plaintext) as CredentialData;
}

export function deleteCredential(userId: string, chain: TheaterChain): void {
  const db = getDb();
  db.prepare("DELETE FROM theater_credentials WHERE user_id = ? AND chain = ?").run(userId, chain);
}

export function listCredentialChains(userId: string): TheaterChain[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT chain FROM theater_credentials WHERE user_id = ?")
    .all(userId) as { chain: TheaterChain }[];
  return rows.map((r) => r.chain);
}
