import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserBookings, cancelBooking } from '@/utils/booking'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Calendar, CreditCard, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard')({
    component: DashboardPage,
})

function DashboardPage() {
    const queryClient = useQueryClient()
    const { data: bookings, isLoading, error } = useQuery({
        queryKey: ['userBookings'],
        queryFn: () => getUserBookings(),
    })

    // Mutation for cancel
    const cancelMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            return cancelBooking({ data: { bookingId } })
        },
        onSuccess: () => {
            toast.success("Booking cancelled successfully.")
            queryClient.invalidateQueries({ queryKey: ['userBookings'] })
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to cancel booking.")
        }
    })

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-2xl font-bold">Error loading bookings</h2>
                <p className="text-muted-foreground">Please try again later.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20 pt-24">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8">
                    <header className="space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight">Your Stays</h1>
                        <p className="text-lg text-muted-foreground">Manage your past and upcoming luxury experiences.</p>
                    </header>

                    {!bookings || bookings.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-20 border-dashed border-2">
                            <CardContent className="text-center space-y-4">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                    <Calendar className="h-8 w-8 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-semibold">No bookings found</h3>
                                    <p className="text-sm text-muted-foreground">You haven't made any bookings yet.</p>
                                </div>
                                <Button asChild>
                                    <a href="/">Explore Our Rooms</a>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {bookings.map((booking) => (
                                <Card key={booking.id} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                                    <div className="flex flex-col sm:flex-row">
                                        <div className="flex-1 p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-muted-foreground">Booking ID: {booking.id.slice(0, 8)}...</p>
                                                    <h3 className="text-xl font-bold">Luxury Retreat</h3>
                                                </div>
                                                <Badge
                                                    variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                                                    className="capitalize px-3 py-1 rounded-full"
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-border/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                                        <Calendar className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Check-in</p>
                                                        <p className="text-sm font-semibold">{format(new Date(booking.checkIn), 'EEE, MMM dd, yyyy')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                                        <Calendar className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Check-out</p>
                                                        <p className="text-sm font-semibold">{format(new Date(booking.checkOut), 'EEE, MMM dd, yyyy')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-2xl font-black text-primary">${booking.totalPrice}</span>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm("Are you sure you want to cancel this booking?")) {
                                                                cancelMutation.mutate(booking.id)
                                                            }
                                                        }}
                                                        disabled={cancelMutation.isPending || booking.status === 'cancelled'}
                                                    >
                                                        {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                        Cancel Stay
                                                    </Button>
                                                    <Button size="sm" variant="secondary" className="group">
                                                        Details
                                                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
