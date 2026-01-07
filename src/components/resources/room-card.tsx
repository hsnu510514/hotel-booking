import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bed, Users, ArrowUpRight } from "lucide-react"
import { Link } from "@tanstack/react-router"

interface RoomCardProps {
    room: {
        id: string
        name: string
        description: string | null
        pricePerNight: string
        capacity: number
        imageUrl: string | null
    }
}

export function RoomCard({ room }: RoomCardProps) {
    return (
        <div className="group block h-full">
            <Card className="h-full overflow-hidden rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm hover-lift">
                <div className="relative aspect-square overflow-hidden">
                    <img
                        src={room.imageUrl || "/placeholder-room.png"}
                        alt={room.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 right-4 focus-within:ring-2">
                        <Badge variant="secondary" className="backdrop-blur-md bg-secondary/80 border-none text-lg px-4 py-1.5 font-bold">
                            ${room.pricePerNight} <span className="text-xs ml-1 opacity-70 font-medium">/ night</span>
                        </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>
                <CardHeader pb-0>
                    <CardTitle className="text-xl font-bold tracking-tight">{room.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1.5">
                            <Bed className="h-4 w-4" />
                            <span>Room</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-border pl-4">
                            <Users className="h-4 w-4" />
                            <span>{room.capacity} Guests</span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {room.description || "Luxurious room with world-class amenities and breathtaking views."}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
