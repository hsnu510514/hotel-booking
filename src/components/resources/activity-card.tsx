import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin } from "lucide-react"

interface ActivityCardProps {
    activity: {
        id: string
        name: string
        description: string | null
        price: string
        duration: string | null
        imageUrl: string | null
    }
}

export function ActivityCard({ activity }: ActivityCardProps) {
    return (
        <Card className="group overflow-hidden rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm hover-lift">
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={activity.imageUrl || "/placeholder-activity.png"}
                    alt={activity.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4">
                    <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md border-none">
                        ${activity.price}
                    </Badge>
                </div>
            </div>
            <CardHeader>
                <CardTitle className="text-xl font-bold tracking-tight">{activity.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{activity.duration || "2 Hours"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>On-site</span>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {activity.description || "Immerse yourself in unique local experiences curated just for you."}
                </p>
            </CardContent>
        </Card>
    )
}
