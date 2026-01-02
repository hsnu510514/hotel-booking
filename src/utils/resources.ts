import { createServerFn } from "@tanstack/react-start"

import { db } from "@/db"
import { roomTypes, mealOptions, activities as activityTable } from "@/db/schema"

export const getRooms = createServerFn({ method: "GET" }).handler(async () => {
    try {
        return await db.select().from(roomTypes)
    } catch (error) {
        console.error("Failed to fetch rooms:", error)
        return []
    }
})

export const getMeals = createServerFn({ method: "GET" }).handler(async () => {
    try {
        return await db.select().from(mealOptions)
    } catch (error) {
        console.error("Failed to fetch meals:", error)
        return []
    }
})

export const getActivities = createServerFn({ method: "GET" }).handler(async () => {
    try {
        return await db.select().from(activityTable)
    } catch (error) {
        console.error("Failed to fetch activities:", error)
        return []
    }
})

