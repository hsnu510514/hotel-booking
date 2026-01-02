import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getSession } from '@/utils/session'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Bed, Utensils, Sparkles, LogOut, ChevronRight, BookOpen } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const session = await getSession()

    if (!session || (session.user as any).role !== 'admin') {
      throw redirect({ to: '/login' })
    }

    return { session }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <div className="flex h-16 items-center border-b border-border/40 px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight">Admin Console</span>
          </Link>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <AdminSidebarLink to="/admin" icon={LayoutDashboard} label="Overview" exact />
          <AdminSidebarLink to="/admin/bookings" icon={BookOpen} label="Bookings" />
          <AdminSidebarLink to="/admin/rooms" icon={Bed} label="Rooms" />
          <AdminSidebarLink to="/admin/meals" icon={Utensils} label="Dining" />
          <AdminSidebarLink to="/admin/activities" icon={Sparkles} label="Experiences" />

          <div className="mt-8 pt-8 border-t border-border/40">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl text-muted-foreground hover:text-destructive"
              onClick={() => window.location.href = "/api/auth/signout"}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64">
        <div className="mx-auto max-w-7xl p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function AdminSidebarLink({ to, icon: Icon, label, exact = false }: { to: string, icon: any, label: string, exact?: boolean }) {
  return (
    <Link
      to={to as any}
      activeOptions={{ exact }}
      activeProps={{ className: 'bg-primary/10 text-primary shadow-sm font-bold' }}
      className="flex items-center justify-between group rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  )
}
