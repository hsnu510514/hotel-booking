import { createFileRoute, redirect } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Button } from "../components/ui/button"
import { getSession } from "../utils/session"

export const Route = createFileRoute("/login")({
    beforeLoad: async () => {
        const session = await getSession()
        if (session) {
            throw redirect({ to: "/" })
        }
    },
    component: LoginComponent,
})

function LoginComponent() {
    const { data: csrfData } = useQuery({
        queryKey: ["csrfToken"],
        queryFn: async () => {
            const res = await fetch("/api/auth/csrf")
            return res.json()
        },
    })

    const csrfToken = csrfData?.csrfToken

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-background p-8 shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
                    <p className="mt-2 text-muted-foreground">
                        Sign in to start booking your stay
                    </p>
                </div>

                <div className="mt-8 flex flex-col gap-4">
                    <form action="/api/auth/signin/google" method="POST">
                        <input type="hidden" name="csrfToken" value={csrfToken} />
                        <Button
                            variant="outline"
                            className="h-12 w-full text-lg"
                            type="submit"
                            disabled={!csrfToken}
                        >
                            Continue with Google
                        </Button>
                    </form>
                    <form action="/api/auth/signin/line" method="POST">
                        <input type="hidden" name="csrfToken" value={csrfToken} />
                        <Button
                            variant="outline"
                            className="h-12 w-full text-lg"
                            type="submit"
                            disabled={!csrfToken}
                        >
                            Continue with LINE
                        </Button>
                    </form>
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    )
}
