import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser, getUserByEmail, updateUserTokens } from "@/lib/db/users";
import { runMigrations } from "@/lib/db/migrate";

// Ensure DB is initialized
let migrated = false;
function ensureDb() {
  if (!migrated) {
    runMigrations();
    migrated = true;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.readonly",
          ].join(" "),
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        ensureDb();
        const user = upsertUser({
          email: profile.email,
          displayName: (profile.name as string) ?? profile.email,
          image: profile.picture as string | undefined,
          googleAccessToken: account.access_token ?? undefined,
          googleRefreshToken: account.refresh_token ?? undefined,
        });
        return !!user;
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        ensureDb();
        const dbUser = getUserByEmail(profile.email);
        if (dbUser) {
          token.userId = dbUser.id;
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
