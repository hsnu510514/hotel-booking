import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <h1 className="relative text-9xl font-bold tracking-tighter text-foreground">
                    404
                </h1>
            </div>

            <h2 className="mt-8 text-3xl font-semibold tracking-tight">
                Page Not Found
            </h2>
            <p className="mt-4 text-muted-foreground max-w-[500px] text-lg">
                Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="rounded-full px-8">
                    <Link to="/">
                        <Home className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8"
                    onClick={() => window.history.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </div>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl opacity-50">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>
            </div>
        </div>
    )
}
