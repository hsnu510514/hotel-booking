import type { AuthConfig } from "@auth/core"
import Google from "@auth/core/providers/google"
import Line from "@auth/core/providers/line"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/utils/db"
import { accounts, sessions, users, verificationTokens } from "@/db/schema"

export const authConfig: AuthConfig = {
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Line({
            clientId: process.env.LINE_CLIENT_ID,
            clientSecret: process.env.LINE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        session: ({ session, user }) => ({
            ...session,
            user: {
                ...session.user,
                id: user.id,
                role: (user as any).role,
            },
        }),
    },
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    skipCSRFCheck: true as any,
    basePath: "/api/auth",
}
