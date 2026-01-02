import { useQuery } from "@tanstack/react-query"
import { RoomCard } from "./room-card"
import { MealCard } from "./meal-card"
import { ActivityCard } from "./activity-card"
import { getRooms, getMeals, getActivities } from "@/utils/resources"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function ResourceGrid() {
    const roomsQuery = useQuery({
        queryKey: ['rooms'],
        queryFn: () => getRooms(),
    })

    const mealsQuery = useQuery({
        queryKey: ['meals'],
        queryFn: () => getMeals(),
    })

    const activitiesQuery = useQuery({
        queryKey: ['activities'],
        queryFn: () => getActivities(),
    })

    const isLoading = roomsQuery.isLoading || mealsQuery.isLoading || activitiesQuery.isLoading

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="aspect-[16/10] w-full rounded-3xl" />
                        <Skeleton className="h-8 w-3/4 rounded-lg" />
                        <Skeleton className="h-4 w-full rounded-lg" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-24">
            {/* Rooms Section */}
            <section id="rooms" className="scroll-mt-24">
                <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-4xl font-bold tracking-tight">Luxurious Accommodations</h2>
                        <p className="mt-2 text-lg text-muted-foreground">Each room is a masterpiece of design and comfort.</p>
                    </div>
                    <p className="text-sm font-medium text-primary cursor-pointer hover:underline">View All Rooms</p>
                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {roomsQuery.data?.map((room, i) => (
                        <div key={room.id} className={cn("animate-in fade-in slide-in-from-bottom-4 duration-700", i === 0 ? "animate-stagger-1" : i === 1 ? "animate-stagger-2" : "animate-stagger-3")}>
                            <RoomCard room={room} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Meals & Activities Split Section */}
            <div className="grid grid-cols-1 gap-24 lg:grid-cols-2">
                {/* Dining Section */}
                <section id="meals" className="scroll-mt-24">
                    <div className="mb-12">
                        <h2 className="text-4xl font-bold tracking-tight">Fine Dining</h2>
                        <p className="mt-2 text-lg text-muted-foreground">Exquisite culinary journeys.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        {mealsQuery.data?.map((meal, i) => (
                            <div key={meal.id} className={cn("animate-in fade-in slide-in-from-bottom-4 duration-700", i % 2 === 0 ? "animate-stagger-1" : "animate-stagger-2")}>
                                <MealCard meal={meal} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Activities Section */}
                <section id="activities" className="scroll-mt-24">
                    <div className="mb-12">
                        <h2 className="text-4xl font-bold tracking-tight">Experiences</h2>
                        <p className="mt-2 text-lg text-muted-foreground">Tailored adventures and relaxation.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        {activitiesQuery.data?.map((activity, i) => (
                            <div key={activity.id} className={cn("animate-in fade-in slide-in-from-bottom-4 duration-700", i % 2 === 0 ? "animate-stagger-1" : "animate-stagger-2")}>
                                <ActivityCard activity={activity} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
