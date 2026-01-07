import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Compass, Clock } from "lucide-react"
import { useState } from "react"

interface ActivityCardProps {
    activity: {
        id: string
        name: string
        description: string | null
        price: string
        startTime: string | null
        endTime: string | null
        imageUrl: string | null
    }
}

export function ActivityCard({ activity }: ActivityCardProps) {
    const [imgSrc, setImgSrc] = useState(activity.imageUrl || "/spa_activity.png")

    return (
        <Card className="group overflow-hidden rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm hover-lift">
            <div className="relative aspect-square overflow-hidden">
                <img
                    src={imgSrc}
                    alt={activity.name}
                    onError={() => setImgSrc("/spa_activity.png")}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="backdrop-blur-md bg-secondary/80 border-none text-lg px-4 py-1.5 font-bold">
                        ${activity.price}
                    </Badge>
                </div>
            </div>
            <CardHeader pb-0>
                <CardTitle className="text-xl font-bold tracking-tight">{activity.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{activity.startTime && activity.endTime ? `${activity.startTime}` : "Flexible"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-border pl-4">
                        <Compass className="h-4 w-4" />
                        <span>Experience</span>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {activity.description || "Immerse yourself in unique local experiences curated just for you."}
                </p>
            </CardContent>
        </Card>
    )
}
