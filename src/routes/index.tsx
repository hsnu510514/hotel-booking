import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowRight, Bed, Utensils, Calendar } from 'lucide-react'
import { ResourceGrid } from '@/components/resources/resource-grid'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background z-10" />
            <img
              src="/luxury_hotel_hero.png"
              alt="Luxury Hotel"
              className="h-full w-full object-cover animate-in fade-in zoom-in duration-1000"
            />
          </div>

          <div className="relative z-20 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md animate-in slide-in-from-bottom-4 duration-700">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Luxury redefined in every detail
            </div>
            <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl animate-in slide-in-from-bottom-8 duration-1000">
              Your Sanctuary <br />
              <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Awaits</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 animate-in slide-in-from-bottom-12 duration-1000">
              Experience the pinnacle of hospitality at LuminaStay. From bespoke suites to world-class dining, we curate moments that last a lifetime.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-in slide-in-from-bottom-16 duration-1000">
              <Link to="/login">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/30 transition-all hover:translate-y-[-2px]">
                  Explore Our Rooms <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all hover:translate-y-[-2px]">
                View Virtual Tour
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
              {[
                { icon: Bed, title: "Luxury Suites", desc: "Designed for ultimate comfort and breathtaking views." },
                { icon: Utensils, title: "Fine Dining", desc: "Gourmet experiences crafted by award-winning chefs." },
                { icon: Calendar, title: "Curated Events", desc: "Local activities and exclusive experiences." }
              ].map((feature, i) => (
                <div key={i} className="group relative rounded-3xl border border-border bg-card p-8 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Resource Selection */}
        <section className="pb-24 sm:pb-32 leading-relaxed">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ResourceGrid />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Haven Stay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
