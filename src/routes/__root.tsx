import {
    createRootRoute,
    Outlet,
    HeadContent,
    Scripts,
    useLocation,
} from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Toaster } from "sonner"
import { Navbar } from "@/components/layout/Navbar"
import "@/globals.css"

import { getSession } from "@/utils/session"
import { QueryClient } from "@tanstack/react-query"

export const Route = createRootRoute({
    context: () => ({
        queryClient: {} as QueryClient,
    }),
    beforeLoad: async () => {
        const session = await getSession()
        return { session }
    },
    head: () => ({
        meta: [
            {
                charSet: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            {
                title: "Hotel Booking System",
            },
        ],
    }),
    component: RootComponent,
})

function RootComponent() {
    const location = useLocation()
    const isAdminPath = location.pathname.startsWith('/admin')

    return (
        <RootDocument>
            {!isAdminPath && <Navbar />}
            <Outlet />
        </RootDocument>
    )
}

function RootDocument({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                <Toaster richColors position="bottom-right" />
                <Scripts />
            </body>
        </html>
    )
}
