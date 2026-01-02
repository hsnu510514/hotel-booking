import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { Calendar as CalendarIcon, ArrowRight, CheckCircle2, CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRooms, getMeals, getActivities } from '@/utils/resources'
import { createBooking } from '@/utils/booking'
import { z } from 'zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { calculateNights, calculateTotalPrice } from '@/utils/pricing'

const bookingSearchSchema = z.object({
    roomId: z.string().optional(),
})

export const Route = createFileRoute('/book')({
    validateSearch: (search) => bookingSearchSchema.parse(search),
    component: BookingPage,
})

function BookingPage() {
    const { roomId } = Route.useSearch()
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [date, setDate] = useState<{
        from: Date
        to: Date
    } | null>(null)

    useEffect(() => {
        setDate({
            from: new Date(),
            to: addDays(new Date(), 3),
        })
    }, [])

    // Data fetching
    const { data: rooms } = useQuery({ queryKey: ['rooms'], queryFn: () => getRooms() })
    const { data: meals } = useQuery({ queryKey: ['meals'], queryFn: () => getMeals() })
    const { data: activities } = useQuery({ queryKey: ['activities'], queryFn: () => getActivities() })

    const selectedRoom = useMemo(() => rooms?.find(r => r.id === roomId), [rooms, roomId])
    const [selectedMeals, setSelectedMeals] = useState<string[]>([])
    const [selectedActivities, setSelectedActivities] = useState<string[]>([])

    const nights = useMemo(() => {
        if (!date?.from || !date?.to) return 1
        return calculateNights(date.from, date.to)
    }, [date])

    const totalPrice = useMemo(() => {
        if (!selectedRoom) return "0.00"

        const mealPrices = selectedMeals.map(id => meals?.find(m => m.id === id)?.price).filter(Boolean) as string[]
        const activityPrices = selectedActivities.map(id => activities?.find(a => a.id === id)?.price).filter(Boolean) as string[]

        return calculateTotalPrice(selectedRoom.pricePerNight, nights, mealPrices, activityPrices)
    }, [selectedRoom, selectedMeals, selectedActivities, nights, meals, activities])

    const toggleMeal = (id: string) => {
        setSelectedMeals(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
    }

    const toggleActivity = (id: string) => {
        setSelectedActivities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
    }

    const handleConfirm = async () => {
        if (!selectedRoom) {
            toast.error("Please select a room first.")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await createBooking({
                data: {
                    roomId: selectedRoom.id,
                    checkIn: date!.from,
                    checkOut: date!.to,
                    mealIds: selectedMeals,
                    activityIds: selectedActivities,
                    totalPrice: totalPrice,
                }
            })

            if (result.success) {
                toast.success("Booking confirmed! Redirecting to your dashboard...")
                setTimeout(() => {
                    navigate({ to: '/dashboard' })
                }, 2000)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create booking. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }
    if (!date) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20 pt-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-12 lg:flex-row">

                    {/* Left Column: Configuration */}
                    <div className="flex-1 space-y-12">
                        <section>
                            <h1 className="text-4xl font-bold tracking-tight">Complete Your Booking</h1>
                            <p className="mt-4 text-lg text-muted-foreground">Select your stay dates and enhance your experience with curated dining and activities.</p>
                        </section>

                        {/* Date Selection */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                <CalendarIcon className="h-6 w-6 text-primary" />
                                Select Dates
                            </h2>
                            <div className="grid gap-4 sm:flex sm:items-center">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "h-14 w-full justify-start text-left font-normal rounded-2xl border-border/50 bg-card/30 sm:w-[350px]",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date?.from ? (
                                                date.to ? (
                                                    <>
                                                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(date.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-3xl border-border/50 shadow-2xl" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={date?.from}
                                            selected={{ from: date.from, to: date.to }}
                                            onSelect={(range: any) => {
                                                if (range?.from && range?.to) {
                                                    setDate({ from: range.from, to: range.to })
                                                } else if (range?.from) {
                                                    //@ts-ignore
                                                    setDate(prev => ({ ...prev, from: range.from }))
                                                }
                                            }}
                                            numberOfMonths={2}
                                            className="rounded-3xl"
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Badge variant="secondary" className="h-8 rounded-full px-4">
                                    {nights} {nights === 1 ? 'Night' : 'Nights'}
                                </Badge>
                            </div>
                        </section>

                        {/* Room Selection */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
                                <CheckCircle2 className="h-6 w-6 text-primary" />
                                Select Your Sanctuary
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rooms?.map(room => (
                                    <Link
                                        key={room.id}
                                        to="/book"
                                        search={(prev) => ({ ...prev, roomId: room.id })}
                                        className={cn(
                                            "relative p-4 border rounded-2xl transition-all cursor-pointer bg-card/50 overflow-hidden group block",
                                            selectedRoom?.id === room.id
                                                ? "border-primary bg-primary/5 shadow-md"
                                                : "border-border/50 hover:border-primary/30"
                                        )}
                                    >
                                        <div className="flex gap-4 items-center">
                                            <div className="h-16 w-16 rounded-xl overflow-hidden shadow-sm">
                                                <img src={room.imageUrl || ''} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold">{room.name}</p>
                                                <p className="text-sm text-muted-foreground">${room.pricePerNight} / night</p>
                                            </div>
                                            {selectedRoom?.id === room.id && (
                                                <div className="absolute top-2 right-2">
                                                    <Badge className="bg-primary text-primary-foreground">Selected</Badge>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* Add-ons Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Meals */}
                            <section className="space-y-6">
                                <h2 className="text-2xl font-semibold">Dining Add-ons</h2>
                                <div className="space-y-4">
                                    {meals?.map(meal => (
                                        <div
                                            key={meal.id}
                                            onClick={() => toggleMeal(meal.id)}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer",
                                                selectedMeals.includes(meal.id) ? "border-primary bg-primary/10 shadow-md" : "border-border/50 hover:border-primary/30"
                                            )}
                                        >
                                            <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm">
                                                <img src={meal.imageUrl || ''} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">{meal.name}</p>
                                                <p className="text-xs text-muted-foreground">${meal.price}</p>
                                            </div>
                                            {selectedMeals.includes(meal.id) && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Activities */}
                            <section className="space-y-6">
                                <h2 className="text-2xl font-semibold">Experiences</h2>
                                <div className="space-y-4">
                                    {activities?.map(activity => (
                                        <div
                                            key={activity.id}
                                            onClick={() => toggleActivity(activity.id)}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer",
                                                selectedActivities.includes(activity.id) ? "border-primary bg-primary/10 shadow-md" : "border-border/50 hover:border-primary/30"
                                            )}
                                        >
                                            <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm">
                                                <img src={activity.imageUrl || ''} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">{activity.name}</p>
                                                <p className="text-xs text-muted-foreground">${activity.price} • {activity.duration}</p>
                                            </div>
                                            {selectedActivities.includes(activity.id) && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Right Column: Checkout Summary */}
                    <div className="lg:w-[400px]">
                        <Card className="sticky top-32 overflow-hidden rounded-3xl border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
                            <CardHeader className="bg-primary/5 pb-8">
                                <CardTitle className="text-2xl font-bold">Booking Summary</CardTitle>
                                <CardDescription>Review your stay details below</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8 space-y-6">

                                {/* Dates */}
                                <div className="flex justify-between items-center py-4 border-b border-border/50">
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground block text-sm">Stay Duration</span>
                                        <span className="font-medium">{format(date.from, "MMM dd")} - {format(date.to, "MMM dd")}</span>
                                    </div>
                                    <Badge variant="outline" className="rounded-full">{nights} nights</Badge>
                                </div>

                                {/* Items */}
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedRoom && (
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <span className="text-foreground font-medium block">{selectedRoom.name}</span>
                                                <span className="text-xs text-muted-foreground">${selectedRoom.pricePerNight} x {nights} nights</span>
                                            </div>
                                            <span className="font-bold">${(parseFloat(selectedRoom.pricePerNight) * nights).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {selectedMeals.map(id => {
                                        const meal = meals?.find(m => m.id === id)
                                        return (
                                            <div key={id} className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">{meal?.name}</span>
                                                <span>${meal?.price}</span>
                                            </div>
                                        )
                                    })}
                                    {selectedActivities.map(id => {
                                        const act = activities?.find(a => a.id === id)
                                        return (
                                            <div key={id} className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">{act?.name}</span>
                                                <span>${act?.price}</span>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="pt-6 border-t border-border flex justify-between items-center">
                                    <span className="text-xl font-bold">Total Amount</span>
                                    <span className="text-3xl font-black text-primary">${totalPrice}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="pb-8">
                                <Button
                                    onClick={handleConfirm}
                                    disabled={isSubmitting || !selectedRoom}
                                    className="w-full h-16 rounded-2xl text-lg font-bold group shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Confirming...
                                        </>
                                    ) : (
                                        <>
                                            Confirm Booking
                                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>

                        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <CreditCard className="h-4 w-4" />
                            Secure Payment Powered by Stripe
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
