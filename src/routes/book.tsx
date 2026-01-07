import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { format, addDays, eachDayOfInterval, startOfDay } from 'date-fns'
import {
    Calendar as CalendarIcon,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Loader2,
    Utensils,
    Sparkles,
    Bed,
    Plus,
    Minus,
    Info,
    Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { createBooking } from '@/utils/booking'
import { getAvailableResources } from '@/utils/availability'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { calculateNights, calculateTotalPrice, PricingItem } from '@/utils/pricing'

const bookingSearchSchema = z.object({
    roomId: z.string().optional(),
})

export const Route = createFileRoute('/book')({
    validateSearch: (search) => bookingSearchSchema.parse(search),
    component: BookingPage,
})

type Step = 'dates' | 'activities' | 'rooms' | 'meals' | 'summary'

// Helper types for the availability results
type RoomResult = { id: string; name: string; description: string | null; pricePerNight: string; capacity: number; totalInventory: number; imageUrl: string | null; remainingCount: number }
type MealResult = { id: string; name: string; description: string | null; price: string; totalInventory: number; imageUrl: string | null; remainingCount: number }
type ActivityResult = { id: string; name: string; description: string | null; price: string; startTime: string | null; endTime: string | null; totalInventory: number; imageUrl: string | null; remainingCount: number }

function BookingPage() {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState<Step>('dates')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Selection States
    // Selection States
    type CartItem = {
        id: string
        resourceId: string
        type: 'activity' | 'meal' | 'room'
        name: string
        price: string
        date: Date
        quantity: number
        startTime?: string | null
        endTime?: string | null
        imageUrl?: string | null
        startDate?: Date
        endDate?: Date
    }

    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null)
    const [roomDateRange, setRoomDateRange] = useState<{ from: Date; to: Date } | null>(null)

    // Selection States
    const [pendingSelections, setPendingSelections] = useState<Record<string, { quantity: number; date: Date }>>({})
    const [cartItems, setCartItems] = useState<CartItem[]>([])

    useEffect(() => {
        const from = new Date()
        const to = addDays(new Date(), 3)
        setDateRange({ from, to })
        setRoomDateRange({ from, to })
    }, [])

    // Availability Queries
    const { data: availableActivities, isLoading: loadingActs } = useQuery({
        queryKey: ['availability', 'activity', dateRange],
        queryFn: async () => {
            if (!dateRange) return null
            const res = await getAvailableResources({ data: { type: 'activity', dateRange } })
            return res as ActivityResult[]
        },
        enabled: !!dateRange
    })

    const { data: availableRooms, isLoading: loadingRooms } = useQuery({
        queryKey: ['availability', 'room', roomDateRange],
        queryFn: async () => {
            if (!roomDateRange) return null
            const res = await getAvailableResources({ data: { type: 'room', dateRange: roomDateRange } })
            return res as RoomResult[]
        },
        enabled: !!roomDateRange
    })

    const { data: availableMeals, isLoading: loadingMeals } = useQuery({
        queryKey: ['availability', 'meal', roomDateRange],
        queryFn: async () => {
            if (!roomDateRange) return null
            const res = await getAvailableResources({ data: { type: 'meal', dateRange: roomDateRange } })
            return res as MealResult[]
        },
        enabled: !!roomDateRange
    })

    const filteredActivities = useMemo(() => {
        const raw = availableActivities?.filter(act => act.remainingCount > 0) || []
        return Array.from(new Map(raw.map(m => [m.id, m])).values())
    }, [availableActivities])

    const filteredRooms = useMemo(() => {
        const raw = availableRooms?.filter(room => room.remainingCount > 0) || []
        return Array.from(new Map(raw.map(m => [m.id, m])).values())
    }, [availableRooms])

    const filteredMeals = useMemo(() => {
        const raw = availableMeals?.filter(meal => meal.remainingCount > 0) || []
        return Array.from(new Map(raw.map(m => [m.id, m])).values())
    }, [availableMeals])

    const nights = useMemo(() => {
        if (!roomDateRange?.from || !roomDateRange?.to) return 1
        return calculateNights(roomDateRange.from, roomDateRange.to)
    }, [roomDateRange])

    const itemDayCart = useMemo(() => {
        const map = new Map<string, Map<string, number>>()
        cartItems.forEach(item => {
            if (!map.has(item.resourceId)) map.set(item.resourceId, new Map())
            const dayMap = map.get(item.resourceId)!

            const days = eachDayOfInterval({
                start: startOfDay(item.startDate || item.date),
                end: startOfDay(item.endDate || item.date)
            })

            days.forEach(d => {
                const key = d.toISOString()
                dayMap.set(key, (dayMap.get(key) || 0) + item.quantity)
            })
        })
        return map
    }, [cartItems])

    const getRealRemaining = (item: RoomResult | MealResult | ActivityResult, range: { from: Date; to: Date }) => {
        const days = eachDayOfInterval({ start: startOfDay(range.from), end: startOfDay(range.to) })
        const dayMap = itemDayCart.get(item.id)

        let maxInCartOnAnyDay = 0
        days.forEach(day => {
            const inCart = dayMap?.get(day.toISOString()) || 0
            maxInCartOnAnyDay = Math.max(maxInCartOnAnyDay, inCart)
        })

        return Math.max(0, item.remainingCount - maxInCartOnAnyDay)
    }

    const pricingItems = useMemo(() => {
        const items: PricingItem[] = []

        cartItems.forEach(item => {
            if (item.type === 'room' && item.startDate && item.endDate) {
                const itemNights = calculateNights(item.startDate, item.endDate)
                items.push({ price: item.price, quantity: item.quantity, nights: itemNights })
            } else {
                items.push({ price: item.price, quantity: item.quantity })
            }
        })

        return items
    }, [cartItems])

    const totalPrice = calculateTotalPrice(pricingItems)

    const handleConfirm = async () => {
        const hasRooms = cartItems.some(i => i.type === 'room')
        if (!hasRooms) {
            toast.error("Please select a room to stay.")
            return
        }

        setIsSubmitting(true)
        try {
            const bookingItems = cartItems.map(item => ({
                type: item.type,
                itemId: item.resourceId,
                quantity: item.quantity,
                startDate: item.startDate || item.date,
                endDate: item.endDate || item.date
            }))

            const result = await createBooking({
                data: {
                    checkIn: roomDateRange!.from,
                    checkOut: roomDateRange!.to,
                    items: bookingItems,
                    totalPrice: totalPrice.toString()
                }
            })

            if (result.success) {
                toast.success("Reservation confirmed!")
                navigate({ to: '/dashboard' })
            }
        } catch (error: any) {
            toast.error(error.message || "Booking failed.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Input Helpers
    const updateQuantity = (id: string, delta: number, max: number) => {
        setPendingSelections(prev => {
            // Default to start date if not set
            const current = prev[id] || { quantity: 0, date: roomDateRange?.from || new Date() }
            const nextQty = Math.max(0, Math.min(max, current.quantity + delta))
            return { ...prev, [id]: { ...current, quantity: nextQty } }
        })
    }

    const updateDate = (id: string, date: Date) => {
        setPendingSelections(prev => {
            const current = prev[id] || { quantity: 0, date: roomDateRange?.from || new Date() }
            return { ...prev, [id]: { ...current, date } }
        })
    }

    const addToCart = (item: ActivityResult | MealResult | RoomResult, type: 'activity' | 'meal' | 'room') => {
        const selection = pendingSelections[item.id]
        if (!selection || selection.quantity <= 0) return

        setCartItems(prev => {
            const isRoom = type === 'room'
            const existingIndex = prev.findIndex(i =>
                i.resourceId === item.id &&
                (isRoom
                    ? (i.startDate && i.endDate &&
                        format(i.startDate, 'yyyy-MM-dd') === format(roomDateRange!.from, 'yyyy-MM-dd') &&
                        format(i.endDate, 'yyyy-MM-dd') === format(roomDateRange!.to, 'yyyy-MM-dd'))
                    : format(i.date, 'yyyy-MM-dd') === format(selection.date, 'yyyy-MM-dd'))
            )

            if (existingIndex >= 0) {
                return prev.map((it, idx) =>
                    idx === existingIndex
                        ? { ...it, quantity: it.quantity + selection.quantity }
                        : it
                )
            }

            const newItem: CartItem = {
                id: crypto.randomUUID(),
                resourceId: item.id,
                type,
                name: item.name,
                price: isRoom ? (item as RoomResult).pricePerNight : (item as (ActivityResult | MealResult)).price,
                date: selection.date,
                startDate: isRoom ? roomDateRange!.from : undefined,
                endDate: isRoom ? roomDateRange!.to : undefined,
                quantity: selection.quantity,
                startTime: (type === 'activity' ? (item as ActivityResult).startTime : undefined),
                endTime: (type === 'activity' ? (item as ActivityResult).endTime : undefined),
                imageUrl: item.imageUrl
            }
            return [...prev, newItem]
        })

        setPendingSelections(prev => ({
            ...prev,
            [item.id]: { ...selection, quantity: 0 }
        }))
        toast.success("Added to itinerary!")
    }

    const removeFromCart = (id: string) => {
        setCartItems(prev => prev.filter(i => i.id !== id))
    }

    if (!dateRange) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="min-h-screen bg-background pb-20 pt-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* Progress Header */}
                <div className="mb-12 flex items-center justify-between">
                    {[
                        { id: 'dates', label: 'Dates', icon: CalendarIcon },
                        { id: 'activities', label: 'Experiences', icon: Sparkles },
                        { id: 'rooms', label: 'Residence', icon: Bed },
                        { id: 'meals', label: 'Dining', icon: Utensils },
                        { id: 'summary', label: 'Confirm', icon: CreditCard },
                    ].map((s, idx) => {
                        const active = currentStep === s.id
                        const done = idx < ['dates', 'activities', 'rooms', 'meals', 'summary'].indexOf(currentStep)
                        // Allow jumping to any step if dates are selected, or to previous steps always
                        const canJump = dateRange !== null || done || active

                        return (
                            <div key={s.id} className="flex flex-1 items-center gap-2 group">
                                <button
                                    onClick={() => canJump && setCurrentStep(s.id as Step)}
                                    disabled={!canJump}
                                    className={cn(
                                        "flex items-center gap-2 transition-all outline-none",
                                        canJump ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-50"
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                                        active ? "bg-primary text-primary-foreground scale-110 shadow-lg" :
                                            done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                                        canJump && !active && "group-hover:ring-2 group-hover:ring-primary/20"
                                    )}>
                                        {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                                    </div>
                                    <span className={cn(
                                        "text-sm font-bold hidden md:block transition-colors",
                                        active ? "text-foreground" : "text-muted-foreground",
                                        canJump && !active && "group-hover:text-primary"
                                    )}>{s.label}</span>
                                </button>
                                {idx < 4 && <div className="hidden md:block h-[2px] flex-1 bg-muted mx-4" />}
                            </div>
                        )
                    })}
                </div>

                <div className={cn(
                    "flex flex-col gap-12",
                    currentStep === 'dates' ? "lg:flex-col" : "lg:flex-row"
                )}>
                    <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* STEP 1: DATES */}
                        {currentStep === 'dates' && (
                            <section className="space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black">Plan Your Stay</h2>
                                    <p className="text-muted-foreground">Select your arrival and departure dates to begin your LuminaStay journey.</p>
                                </div>
                                <div className="flex justify-center py-6">
                                    <Calendar
                                        mode="range"
                                        min={1}
                                        selected={dateRange ?? undefined}
                                        onSelect={(r: any) => setDateRange(r)}
                                        numberOfMonths={2}
                                        className="rounded-[32px] border border-border/20 bg-background/50 p-8 shadow-xl backdrop-blur-sm"
                                        classNames={{
                                            months: "flex flex-col md:flex-row gap-8",
                                            month: "space-y-4",
                                            caption: "flex justify-center pt-1 relative items-center mb-4",
                                            caption_label: "text-base font-semibold tracking-wide",
                                            nav: "space-x-1 flex items-center",
                                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                                            nav_button_previous: "absolute left-1",
                                            nav_button_next: "absolute right-1",
                                            table: "w-full border-collapse space-y-1",
                                            head_row: "flex",
                                            head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] mb-2 uppercase tracking-wider",
                                            row: "flex w-full mt-2",
                                            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                            day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-all",
                                            day_range_end: "day-range-end",
                                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                            day_today: "bg-accent text-accent-foreground",
                                            day_outside: "text-muted-foreground opacity-50",
                                            day_disabled: "text-muted-foreground opacity-50",
                                            day_hidden: "invisible",
                                        }}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => {
                                            if (dateRange) {
                                                setRoomDateRange(dateRange)
                                                setCurrentStep('activities')
                                            }
                                        }}
                                        disabled={!dateRange?.from || !dateRange?.to}
                                        className="h-14 rounded-2xl px-8 gap-2 font-bold shadow-xl"
                                    >
                                        Explore Experiences
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </section>
                        )}

                        {/* STEP 2: ACTIVITIES */}
                        {currentStep === 'activities' && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black">Refine Your Stay</h2>
                                        <p className="text-muted-foreground">Select curated experiences available between {format(dateRange.from, 'MMM dd')} and {format(dateRange.to, 'MMM dd')}.</p>
                                    </div>
                                    <Button variant="ghost" className="gap-2" onClick={() => setCurrentStep('dates')}>
                                        <ArrowLeft className="h-4 w-4" /> Change Dates
                                    </Button>
                                </div>

                                {loadingActs ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-3xl bg-muted animate-pulse" />)}
                                    </div>
                                ) : (
                                    filteredActivities.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {filteredActivities.map(act => {
                                                const selection = pendingSelections[act.id] || { quantity: 0, date: dateRange?.from || new Date() }
                                                const hasSelection = selection.quantity > 0
                                                const realRemaining = getRealRemaining(act, { from: selection.date, to: selection.date })
                                                return (
                                                    <Card key={act.id} className={cn(
                                                        "overflow-hidden rounded-3xl border-border/50 transition-all hover-lift",
                                                        hasSelection ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card/40"
                                                    )}>
                                                        <div className="relative h-40">
                                                            <img src={act.imageUrl || ''} className="h-full w-full object-cover" />
                                                            <div className="absolute top-4 right-4">
                                                                <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none">
                                                                    {realRemaining} spots left
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <CardHeader className="pb-2">
                                                            <div className="flex justify-between items-start">
                                                                <CardTitle className="text-lg font-bold">{act.name}</CardTitle>
                                                                {act.startTime && act.endTime && (
                                                                    <Badge variant="secondary" className="text-[10px] font-bold">
                                                                        {act.startTime} - {act.endTime}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <CardDescription className="line-clamp-1">{act.description}</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-2xl font-black text-primary">${act.price}</p>
                                                                <div className="flex items-center gap-3 bg-muted/50 rounded-2xl p-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-xl"
                                                                        onClick={() => updateQuantity(act.id, -1, realRemaining)}
                                                                    >
                                                                        <Minus className="h-3 w-3" />
                                                                    </Button>
                                                                    <span className="w-8 text-center font-bold">{selection.quantity}</span>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-xl"
                                                                        onClick={() => updateQuantity(act.id, 1, realRemaining)}
                                                                    >
                                                                        <Plus className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="pt-2 border-t border-border/40 space-y-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Select Date</label>
                                                                    <Input
                                                                        type="date"
                                                                        className="h-10 mt-1 rounded-xl"
                                                                        min={format(dateRange.from, 'yyyy-MM-dd')}
                                                                        max={format(dateRange.to, 'yyyy-MM-dd')}
                                                                        value={format(selection.date, 'yyyy-MM-dd')}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDate(act.id, new Date(e.target.value))}
                                                                    />
                                                                </div>
                                                                <Button
                                                                    className="w-full rounded-xl font-bold"
                                                                    disabled={!hasSelection || realRemaining < selection.quantity}
                                                                    onClick={() => addToCart(act, 'activity')}
                                                                >
                                                                    Add to Itinerary
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <Card className="flex flex-col items-center justify-center py-12 border-dashed bg-muted/20">
                                            <Sparkles className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                                            <p className="text-lg font-bold text-muted-foreground">No experiences left for these dates</p>
                                            <p className="text-sm text-muted-foreground/60">Try selecting a different date range.</p>
                                        </Card>
                                    )
                                )}

                                <div className="flex justify-end gap-4 mt-8">
                                    <Button variant="outline" className="rounded-2xl h-12" onClick={() => setCurrentStep('dates')}>Back</Button>
                                    <Button onClick={() => setCurrentStep('rooms')} className="h-12 px-8 rounded-2xl gap-2 font-bold shadow-xl">
                                        Select Sanctuary
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </section>
                        )}

                        {/* STEP 3: ROOMS */}
                        {currentStep === 'rooms' && (
                            <section className="space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black">Choose Your Residence</h2>
                                    <p className="text-muted-foreground">Select your stay dates and preferred sanctuary.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 items-center bg-card/30 p-4 rounded-3xl border border-border/50">
                                    <div className="flex-1 w-full">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-2">Stay Interval</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start rounded-2xl h-12 mt-1 focus:ring-0">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {roomDateRange?.from ? format(roomDateRange.from, 'PPP') : 'Start'} — {roomDateRange?.to ? format(roomDateRange.to, 'PPP') : 'End'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-3xl" align="start">
                                                <Calendar
                                                    mode="range"
                                                    selected={roomDateRange ?? undefined}
                                                    onSelect={(r: any) => setRoomDateRange(r)}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <Badge variant="secondary" className="h-12 px-6 rounded-2xl text-lg font-black">{nights} Nights</Badge>
                                </div>

                                {loadingRooms ? (
                                    <div className="space-y-4">
                                        {[1, 2].map(i => <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />)}
                                    </div>
                                ) : (
                                    filteredRooms.length > 0 ? (
                                        <div className="space-y-4">
                                            {filteredRooms.map(room => {
                                                const selection = pendingSelections[room.id] || { quantity: 0, date: roomDateRange?.from || new Date() }
                                                const hasSelection = selection.quantity > 0
                                                const realRemaining = getRealRemaining(room, roomDateRange || { from: new Date(), to: new Date() })
                                                return (
                                                    <Card key={room.id} className={cn(
                                                        "overflow-hidden rounded-3xl border-border/50 transition-all flex flex-col md:flex-row",
                                                        hasSelection ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card/40"
                                                    )}>
                                                        <div className="relative w-full md:w-80 h-48 md:h-auto">
                                                            <img src={room.imageUrl || ''} className="h-full w-full object-cover" />
                                                            <div className="absolute top-4 right-4">
                                                                <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none">
                                                                    {realRemaining} left
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 p-6 flex flex-col justify-between">
                                                            <div>
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h3 className="text-2xl font-bold">{room.name}</h3>
                                                                    <Badge variant="outline" className="rounded-full">{room.capacity} Guests</Badge>
                                                                </div>
                                                                <p className="text-muted-foreground text-sm mb-4">{room.description}</p>
                                                                <Badge className="bg-muted text-muted-foreground mb-4">
                                                                    {room.remainingCount} Suites Available
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center justify-between border-t border-border/40 pt-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-3xl font-black text-primary">${room.pricePerNight}</span>
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Rate per night</span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex items-center gap-3 bg-muted/50 rounded-2xl p-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-10 w-10 rounded-xl"
                                                                            onClick={() => updateQuantity(room.id, -1, realRemaining)}
                                                                        >
                                                                            <Minus className="h-4 w-4" />
                                                                        </Button>
                                                                        <span className="w-8 text-center font-bold text-lg">{selection.quantity}</span>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-10 w-10 rounded-xl"
                                                                            onClick={() => updateQuantity(room.id, 1, realRemaining)}
                                                                        >
                                                                            <Plus className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                    <Button
                                                                        className="rounded-xl font-bold px-6"
                                                                        disabled={!hasSelection || realRemaining < selection.quantity}
                                                                        onClick={() => addToCart(room, 'room')}
                                                                    >
                                                                        Add Stay
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <Card className="flex flex-col items-center justify-center py-12 border-dashed bg-muted/20">
                                            <Bed className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                                            <p className="text-lg font-bold text-muted-foreground">No rooms left for these dates</p>
                                            <p className="text-sm text-muted-foreground/60">Try selecting a different date range or reducing your party size.</p>
                                        </Card>
                                    )
                                )}

                                <div className="flex justify-end gap-4 mt-8">
                                    <Button variant="outline" className="rounded-2xl h-12" onClick={() => setCurrentStep('activities')}>Back</Button>
                                    <Button onClick={() => setCurrentStep('meals')} className="h-12 px-8 rounded-2xl gap-2 font-bold shadow-xl">
                                        Plan Dining
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </section>
                        )}

                        {/* STEP 4: MEALS */}
                        {currentStep === 'meals' && (
                            <section className="space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black">Gourmet Collections</h2>
                                    <p className="text-muted-foreground">Select signature dishes for specific days of your stay.</p>
                                </div>

                                {loadingMeals ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-3xl bg-muted animate-pulse" />)}
                                    </div>
                                ) : (
                                    filteredMeals.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {filteredMeals.map(meal => {
                                                const selection = pendingSelections[meal.id] || { quantity: 0, date: roomDateRange?.from || new Date() }
                                                const hasSelection = selection.quantity > 0
                                                const realRemaining = getRealRemaining(meal, { from: selection.date, to: selection.date })
                                                return (
                                                    <Card key={meal.id} className={cn(
                                                        "overflow-hidden rounded-3xl border-border/50 transition-all flex",
                                                        hasSelection ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card/40"
                                                    )}>
                                                        <div className="relative w-32 h-32 md:w-40 md:h-auto overflow-hidden">
                                                            <img src={meal.imageUrl || ''} className="h-full w-full object-cover" />
                                                            <div className="absolute top-2 right-2">
                                                                <Badge className="bg-background/80 backdrop-blur-md text-[10px] text-foreground border-none px-1.5 h-5">
                                                                    {realRemaining} left
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="font-bold">{meal.name}</h3>
                                                                <span className="text-xs font-bold text-primary">${meal.price}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-0.5">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 rounded-lg"
                                                                        onClick={() => updateQuantity(meal.id, -1, realRemaining)}
                                                                    >
                                                                        <Minus className="h-2 w-2" />
                                                                    </Button>
                                                                    <span className="text-xs font-bold w-4 text-center">{selection.quantity}</span>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 rounded-lg"
                                                                        onClick={() => updateQuantity(meal.id, 1, realRemaining)}
                                                                    >
                                                                        <Plus className="h-2 w-2" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2 mt-2">
                                                                <Input
                                                                    type="date"
                                                                    className="h-8 text-[10px] rounded-lg border-primary/20"
                                                                    min={format(roomDateRange!.from, 'yyyy-MM-dd')}
                                                                    max={format(roomDateRange!.to, 'yyyy-MM-dd')}
                                                                    value={format(selection.date, 'yyyy-MM-dd')}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDate(meal.id, new Date(e.target.value))}
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    className="w-full rounded-lg font-bold text-xs"
                                                                    disabled={!hasSelection || realRemaining < selection.quantity}
                                                                    onClick={() => addToCart(meal, 'meal')}
                                                                >
                                                                    Add Order
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <Card className="flex flex-col items-center justify-center py-12 border-dashed bg-muted/20">
                                            <Utensils className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                                            <p className="text-lg font-bold text-muted-foreground">No dining options left for these dates</p>
                                            <p className="text-sm text-muted-foreground/60">Try selecting a different date range.</p>
                                        </Card>
                                    )
                                )}

                                <div className="flex justify-end gap-4 mt-8">
                                    <Button variant="outline" className="rounded-2xl h-12" onClick={() => setCurrentStep('rooms')}>Back</Button>
                                    <Button onClick={() => setCurrentStep('summary')} className="h-12 px-8 rounded-2xl gap-2 font-bold shadow-xl">
                                        Review Order
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </section>
                        )}

                        {/* STEP 5: SUMMARY */}
                        {currentStep === 'summary' && (
                            <section className="space-y-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black">Final Confirmation</h2>
                                    <p className="text-muted-foreground">Review your curated LuminaStay experience before secure checkout.</p>
                                </div>

                                <Card className="rounded-3xl border-primary/20 bg-primary/5 overflow-hidden">
                                    <div className="bg-primary/10 p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-bold text-primary">
                                            <CalendarIcon className="h-4 w-4" />
                                            Stay: {format(roomDateRange!.from, 'MMM dd')} — {format(roomDateRange!.to, 'MMM dd')}
                                        </div>
                                        <Badge variant="outline" className="border-primary/30 text-primary">{nights} Nights</Badge>
                                    </div>
                                    <CardContent className="p-8 space-y-6">
                                        {cartItems.map((item) => {
                                            const isRoom = item.type === 'room'
                                            return (
                                                <div key={item.id} className="flex justify-between items-center group">
                                                    <div className="flex gap-4 items-center">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-xl flex items-center justify-center",
                                                            isRoom ? "bg-primary/20 text-primary" :
                                                                item.type === 'activity' ? "bg-purple-500/20 text-purple-600" : "bg-orange-500/20 text-orange-600"
                                                        )}>
                                                            {isRoom ? <Bed className="h-5 w-5" /> :
                                                                item.type === 'activity' ? <Sparkles className="h-5 w-5" /> : <Utensils className="h-5 w-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{item.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.quantity} x • {isRoom ? `${format(item.startDate!, 'MMM dd')} - ${format(item.endDate!, 'MMM dd')}` : format(item.date, 'MMM dd')}
                                                                {item.startTime && ` • ${item.startTime} - ${item.endTime}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="font-black text-lg">
                                                        ${isRoom
                                                            ? (parseFloat(item.price) * item.quantity * calculateNights(item.startDate!, item.endDate!)).toFixed(2)
                                                            : (parseFloat(item.price) * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </CardContent>
                                    <div className="bg-primary p-8 flex justify-between items-center text-primary-foreground">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold uppercase tracking-widest opacity-80">Total Stay Investment</p>
                                            <p className="text-4xl font-black">${totalPrice}</p>
                                        </div>
                                        <Button
                                            size="lg"
                                            onClick={handleConfirm}
                                            disabled={isSubmitting}
                                            className="h-14 bg-white text-primary hover:bg-white/90 rounded-2xl px-10 font-bold text-lg shadow-2xl"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm Reservation'}
                                        </Button>
                                    </div>
                                </Card>

                                <div className="flex justify-start gap-4">
                                    <Button variant="ghost" onClick={() => setCurrentStep('meals')}>Back to Dining</Button>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Quick Info Sidebar */}
                    <div className={cn(
                        "space-y-6 shrink-0",
                        currentStep === 'dates' ? "lg:w-full lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0" : "lg:w-80"
                    )}>
                        <Card className="rounded-3xl border-border/40 bg-card/50 backdrop-blur-xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Info className="h-4 w-4" /> Policy Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-xs font-medium leading-relaxed">
                                <p>• Flexible cancellation up to 48 hours before arrival.</p>
                                <p>• Real-time inventory is held for 15 minutes during selection.</p>
                                <p>• All gourmet meals are prepared fresh to order on specified dates.</p>
                                <div className="pt-4 border-t border-border/40 text-primary font-bold">
                                    Current Selection Total: ${totalPrice}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Itinerary Cart */}
                        {cartItems.length > 0 && (
                            <Card className="rounded-3xl border-border/40 bg-card/50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" /> Your Itinerary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start text-xs border-b border-border/20 last:border-0 pb-2 last:pb-0">
                                            <div className="flex-1">
                                                <p className="font-bold">{item.name}</p>
                                                <p className="text-muted-foreground">{format(item.date, 'MMM dd')} • {item.quantity} qty</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold">
                                                    ${item.type === 'room'
                                                        ? (parseFloat(item.price) * item.quantity * calculateNights(item.startDate!, item.endDate!)).toFixed(0)
                                                        : (parseFloat(item.price) * item.quantity).toFixed(0)}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-2 flex justify-between items-center">
                                        <span className="text-xs font-bold text-muted-foreground uppercase">Itinerary Total</span>
                                        <span className="text-primary font-black">${totalPrice}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Input({ className, ...props }: any) {
    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    )
}
