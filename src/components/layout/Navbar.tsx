import { Link, useRouteContext, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { User, LogOut, LayoutDashboard, Hotel, ShieldCheck } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { elevateToAdmin } from '@/utils/admin'
import { toast } from 'sonner'

export function Navbar() {
    const { session } = useRouteContext({ from: '__root__' }) as any
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const elevateMutation = useMutation({
        mutationFn: elevateToAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['session'] })
            toast.success('You are now an Admin!')
            window.location.reload() // Reload to refresh context
        }
    })

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                                <Hotel className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-foreground">
                                Lumina<span className="text-primary">Stay</span>
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-6">
                            <Link
                                to="/"
                                hash="rooms"
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                            >
                                Experience
                            </Link>
                            <Link
                                to="/"
                                hash="meals"
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                            >
                                Dining
                            </Link>
                            <Link
                                to="/"
                                hash="activities"
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                            >
                                Spa
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {session ? (
                            <>
                                {session.user.role === 'admin' ? (
                                    <Link to="/admin">
                                        <Button variant="ghost" size="sm" className="gap-2 rounded-full border border-primary/20 bg-primary/5 text-primary">
                                            <ShieldCheck className="h-4 w-4" />
                                            <span>Admin Console</span>
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 rounded-full text-[10px] h-8 border-dashed"
                                            onClick={() => elevateMutation.mutate({})}
                                            disabled={elevateMutation.isPending}
                                        >
                                            {elevateMutation.isPending ? '...' : 'Become Admin'}
                                        </Button>
                                        <Link to="/dashboard">
                                            <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                                                <LayoutDashboard className="h-4 w-4" />
                                                <span>Dashboard</span>
                                            </Button>
                                        </Link>
                                    </>
                                )}
                                <div className="h-8 w-[1px] bg-border/60 mx-1" />
                                <div className="flex items-center gap-3 pl-2">
                                    <div className="flex flex-col items-end pointer-events-none text-right">
                                        <span className="text-sm font-bold leading-none">{session.user?.name}</span>
                                        <span className="text-[10px] text-muted-foreground leading-none mt-1 uppercase tracking-widest font-bold">
                                            {session.user.role === 'admin' ? 'Administrator' : 'Guest'}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Sign out"
                                        className="rounded-full h-10 w-10 border border-border/40 bg-card/40"
                                        onClick={() => {
                                            window.location.href = "/api/auth/signout"
                                        }}
                                    >
                                        <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Link to="/login">
                                <Button className="rounded-full px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                    Book Your Stay
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
