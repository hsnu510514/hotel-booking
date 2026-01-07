import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Utensils } from "lucide-react"

interface MealCardProps {
    meal: {
        id: string
        name: string
        description: string | null
        price: string
        imageUrl: string | null
    }
}

export function MealCard({ meal }: MealCardProps) {
    return (
        <Card className="group overflow-hidden rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm hover-lift">
            <div className="relative aspect-square overflow-hidden">
                <img
                    src={meal.imageUrl || "/placeholder-meal.png"}
                    alt={meal.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 text-white">
                    <Badge variant="secondary" className="backdrop-blur-md bg-secondary/80 border-none text-lg px-4 py-1.5 font-bold">
                        ${meal.price}
                    </Badge>
                </div>
            </div>
            <CardHeader>
                <CardTitle className="text-xl font-bold tracking-tight">{meal.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Utensils className="h-4 w-4" />
                    <span>Gourmet Selection</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {meal.description || "A delicious gourmet experience prepared by our expert chefs."}
                </p>
            </CardContent>
        </Card>
    )
}
