import { db } from './index'
import { roomTypes, mealOptions, activities } from './schema'

async function seed() {
    console.log('Seeding database...')

    // Rooms
    const rooms = await db.insert(roomTypes).values([
        {
            name: "Ocean View Deluxe",
            description: "A spacious suite featuring floor-to-ceiling windows with a panoramic view of the turquoise ocean.",
            pricePerNight: "450.00",
            capacity: 2,
            imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000"
        },
        {
            name: "Royal Penthouse",
            description: "The ultimate luxury experience with a private pool, butler service, and 360-degree city views.",
            pricePerNight: "1200.00",
            capacity: 4,
            imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000"
        },
        {
            name: "Garden Sanctuary",
            description: "Tucked away in our lush tropical gardens, this room offers peace, privacy, and natural beauty.",
            pricePerNight: "320.00",
            capacity: 2,
            imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000"
        }
    ]).returning()

    // Meals
    await db.insert(mealOptions).values([
        {
            name: "Sunrise Gourmet Breakfast",
            description: "Freshly baked artisanal pastries, seasonal fruits, and premium roasted coffee.",
            price: "45.00",
            imageUrl: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=1000"
        },
        {
            name: "Chef's Signature Dinner",
            description: "A 5-course tasting menu featuring locally sourced ingredients and wine pairings.",
            price: "150.00",
            imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1000"
        }
    ])

    // Activities
    await db.insert(activities).values([
        {
            name: "Midnight Zen Spa",
            description: "Relaxing aromatherapy massage under the stars with soothing ocean sounds.",
            price: "120.00",
            duration: "90 Mins",
            imageUrl: "https://images.unsplash.com/photo-1544161515-4ae6ce6ca606?auto=format&fit=crop&q=80&w=1000"
        },
        {
            name: "Coral Reef Snorkeling",
            description: "Guided tour through our private reef to discover vibrant marine life.",
            price: "85.00",
            duration: "3 Hours",
            imageUrl: "https://images.unsplash.com/photo-1544551763-47a184119879?auto=format&fit=crop&q=80&w=1000"
        }
    ])

    console.log('Seeding complete!')
}

seed().catch(err => {
    console.error('Seeding failed:', err)
    process.exit(1)
})
