import { Link, useRouteContext, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { User, LogOut, LayoutDashboard, Hotel, ShieldCheck, Menu } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { elevateToAdmin } from '@/utils/admin'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

export function Navbar() {
    const { session } = useRouteContext({ from: '__root__' }) as any
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)

    const elevateMutation = useMutation({
        mutationFn: elevateToAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['session'] })
            toast.success('You are now an Admin!')
            window.location.reload() // Reload to refresh context
        }
    })

    const NavLinks = () => (
        <>
            <Link
                to="/"
                hash="rooms"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
            >
                Accommodations
            </Link>
            <Link
                to="/"
                hash="meals"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
            >
                Dining
            </Link>
            <Link
                to="/"
                hash="activities"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
            >
                Experiences
            </Link>
        </>
    )

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/10 bg-background/95 backdrop-blur-xl shadow-sm supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    <div className="flex items-center gap-12">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                                <Hotel className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-lg font-bold tracking-tight text-foreground">Lumina</span>
                                <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase text-[10px]">Sanctuary</span>
                            </div>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            <NavLinks />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4">
                            {session ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <Link to="/dashboard">
                                            <Button variant="ghost" size="sm" className="gap-2 rounded-full font-medium text-muted-foreground hover:text-primary">
                                                <LayoutDashboard className="h-4 w-4" />
                                                <span>My Bookings</span>
                                            </Button>
                                        </Link>

                                        {session.user.role === 'admin' ? (
                                            <Link to="/admin">
                                                <Button variant="ghost" size="sm" className="gap-2 rounded-full border border-primary/10 bg-primary/5 text-primary hover:bg-primary/10">
                                                    <ShieldCheck className="h-4 w-4" />
                                                    <span>Console</span>
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-2 rounded-full text-xs text-muted-foreground hover:text-primary"
                                                onClick={() => elevateMutation.mutate({})}
                                                disabled={elevateMutation.isPending}
                                            >
                                                {elevateMutation.isPending ? '...' : 'Admin Access'}
                                            </Button>
                                        )}
                                    </div>

                                    <div className="h-4 w-[1px] bg-border mx-2" />

                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden lg:block">
                                            <p className="text-sm font-semibold leading-none">{session.user?.name}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full h-9 w-9 border border-border bg-background hover:bg-muted transition-colors"
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
                                    <Button className="rounded-full px-6 h-10 font-medium shadow-xl shadow-primary/10 transition-all hover:-translate-y-0.5">
                                        Sign In
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu */}
                        <div className="md:hidden">
                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <Menu className="h-6 w-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                    <div className="flex flex-col gap-6 mt-8">
                                        <NavLinks />
                                        <div className="h-[1px] bg-border w-full" />
                                        {session ? (
                                            <div className="flex flex-col gap-3">
                                                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                                                    <Button variant="outline" className="w-full justify-start gap-2">
                                                        <LayoutDashboard className="h-4 w-4" />
                                                        My Bookings
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="secondary"
                                                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        window.location.href = "/api/auth/signout"
                                                    }}
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Sign Out
                                                </Button>
                                            </div>
                                        ) : (
                                            <Link to="/login" onClick={() => setIsOpen(false)}>
                                                <Button className="w-full">Sign In</Button>
                                            </Link>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
