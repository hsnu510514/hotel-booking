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
import { NotFound } from "@/components/layout/NotFound"

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
                title: "Lumina Sanctuary - Luxury Hotel Booking",
            },
            {
                name: "description",
                content: "Experience luxury and comfort at Lumina Sanctuary. Book your stay, dining, and activities with us.",
            },
            {
                property: "og:title",
                content: "Lumina Sanctuary - Luxury Hotel Booking",
            },
            {
                property: "og:description",
                content: "Experience luxury and comfort at Lumina Sanctuary. Book your stay, dining, and activities with us.",
            },
            {
                property: "og:image",
                content: "/luxury_hotel_hero.png",
            },
            {
                property: "og:type",
                content: "website",
            },
            {
                name: "twitter:card",
                content: "summary_large_image",
            },
            {
                name: "twitter:title",
                content: "Lumina Sanctuary - Luxury Hotel Booking",
            },
            {
                name: "twitter:description",
                content: "Experience luxury and comfort at Lumina Sanctuary. Book your stay, dining, and activities with us.",
            },
            {
                name: "twitter:image",
                content: "/luxury_hotel_hero.png",
            },
        ],
        links: [
            { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        ],
    }),
    component: RootComponent,
    notFoundComponent: () => <NotFound />,
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
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body suppressHydrationWarning>
                {children}
                <Toaster richColors position="bottom-right" />
                <Scripts />
            </body>
        </html>
    )
}
