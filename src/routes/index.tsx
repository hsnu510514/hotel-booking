import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowRight, Bed, Utensils, Calendar, Star, Shield, Smartphone } from 'lucide-react'
import { ResourceGrid } from '@/components/resources/resource-grid'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans selection:bg-primary selection:text-primary-foreground">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex min-h-screen flex-col justify-center overflow-hidden">
          {/* Background Image with Parallax-like effect */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-background z-10" />
            <img
              src="/luxury_hotel_hero.png"
              alt="Luxury Hotel"
              className="h-full w-full object-cover animate-in fade-in zoom-in duration-[2000ms]"
            />
          </div>

          <div className="relative z-20 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 flex flex-col items-center gap-8 pt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-medium text-white backdrop-blur-md animate-in slide-in-from-bottom-8 duration-1000 shadow-2xl">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>5-Star Luxury Experience</span>
            </div>

            <h1 className="max-w-4xl text-6xl font-black tracking-tighter text-white sm:text-7xl lg:text-9xl animate-in slide-in-from-bottom-12 duration-[1500ms] text-balance">
              Your Sanctuary <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-white to-orange-200">Awaits</span>
            </h1>

            <p className="max-w-2xl text-xl text-white/90 animate-in slide-in-from-bottom-16 duration-[1500ms] leading-relaxed font-light">
              Experience the pinnacle of hospitality at LuminaStay. Where bespoke design meets unparalleled comfort in the heart of paradise.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-20 duration-[1500ms] mt-4">
              <Button
                size="lg"
                className="h-14 px-8 text-lg rounded-full shadow-2xl shadow-white/10 bg-white text-black hover:bg-white/90 hover:scale-105 transition-all duration-300"
                onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Accommodations
              </Button>
              <Link to="/book">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-white/30 bg-black/20 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/50 transition-all">
                  Book Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Resource Selection */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ResourceGrid />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 py-16">
        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center justify-between gap-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            <span className="text-xl font-bold">LuminaStay</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LuminaStay. All rights reserved.
          </p>
          <div className="flex gap-6 text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
