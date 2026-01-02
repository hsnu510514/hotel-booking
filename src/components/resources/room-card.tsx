import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bed, Users } from "lucide-react"
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
        <Card className="group overflow-hidden rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm hover-lift">
            <div className="relative aspect-[16/10] overflow-hidden">
                <img
                    src={room.imageUrl || "/placeholder-room.png"}
                    alt={room.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4">
                    <Badge className="bg-background/80 text-foreground backdrop-blur-md border-none">
                        ${room.pricePerNight} / night
                    </Badge>
                </div>
            </div>
            <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight">{room.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {room.description || "Luxurious room with world-class amenities and breathtaking views."}
                </p>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Bed className="h-4 w-4" />
                        <span>Premium Bed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>Up to {room.capacity} Guests</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Link to="/book" search={{ roomId: room.id }} className="w-full">
                    <Button className="w-full rounded-2xl group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                        Book This Room
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}
