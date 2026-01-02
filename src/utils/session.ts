import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { Auth } from "@auth/core"
import { authConfig } from "./auth"

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
    const request = getRequest()
    if (!request) return null

    const url = new URL("/api/auth/session", request.url)
    const sessionRes = await Auth(
        new Request(url, { headers: request.headers }),
        authConfig
    )

    const session = await sessionRes.json()
    if (!session || Object.keys(session).length === 0) return null
    return session
})
