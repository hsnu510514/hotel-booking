import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bed, Utensils, Sparkles, TrendingUp, Users, CalendarDays, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAdminStats, getAllBookings } from '@/utils/admin'
import { format } from 'date-fns'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin_stats'],
    queryFn: () => getAdminStats(),
  })

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin_bookings_recent'],
    queryFn: () => getAllBookings(),
  })

  const recentBookings = bookings?.slice(0, 5)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Console Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome back. Here is what's happening at LuminaStay today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Bookings"
          value={statsLoading ? '...' : stats?.activeBookings.toString() || '0'}
          icon={CalendarDays}
          trend="+4% from yesterday"
        />
        <StatCard
          title="Total Guests"
          value={statsLoading ? '...' : stats?.guestCount.toString() || '0'}
          icon={Users}
          trend="+2 today"
        />
        <StatCard
          title="Total Revenue"
          value={statsLoading ? '...' : `$${parseFloat(stats?.totalRevenue.toString() || '0').toLocaleString()}`}
          icon={TrendingUp}
          trend="+12% this week"
        />
        <StatCard
          title="Occupancy"
          value={stats?.occupancyRate || '0%'}
          icon={Bed}
          trend="+2% from last week"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Booking Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-6">
              {bookingsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                </div>
              ) : recentBookings?.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No recent bookings found.</p>
              ) : (
                recentBookings?.map((booking) => (
                  <ActivityItem
                    key={booking.id}
                    icon={CalendarDays}
                    title={`New stay for ${booking.guestName}`}
                    subTitle={booking.guestEmail ?? undefined}
                    time={format(new Date(booking.createdAt!), 'MMM d, p')}
                    color="bg-primary/10 text-primary"
                  />
                ))
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatusIndicator label="Database Connection" status="Operational" pulse />
              <StatusIndicator label="Auth.js Service" status="Operational" pulse />
              <StatusIndicator label="Image Storage" status="Operational" pulse />
              <StatusIndicator label="Mail Server" status="Warning" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend }: { title: string, value: string, icon: any, trend: string }) {
  return (
    <Card className="rounded-3xl border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:shadow-xl hover:shadow-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">{trend}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ icon: Icon, title, subTitle, time, color }: { icon: any, title: string, subTitle?: string, time: string, color: string }) {
  return (
    <li className="flex items-start gap-4">
      <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{title}</p>
        {subTitle && <p className="text-[10px] text-muted-foreground truncate font-medium uppercase tracking-tight">{subTitle}</p>}
        <p className="text-[10px] text-muted-foreground mt-1 font-bold">{time}</p>
      </div>
    </li>
  )
}

function StatusIndicator({ label, status, pulse = false }: { label: string, status: string, pulse?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-4 border border-border/40">
      <span className="text-sm font-bold tracking-tight">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${status === 'Operational' ? 'bg-green-500' : 'bg-yellow-500'} ${pulse && 'animate-pulse'}`} />
        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{status}</span>
      </div>
    </div>
  )
}
