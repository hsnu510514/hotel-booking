import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllBookings, updateBookingStatus } from '@/utils/admin'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Calendar, User, CreditCard, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useNavigate, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/bookings')({
  component: AdminBookingsPage,
})

function AdminBookingsPage() {
  const queryClient = useQueryClient()
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => getAllBookings(),
  })

  const statusMutation = useMutation({
    mutationFn: updateBookingStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      toast.success('Booking status updated')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update status')
    }
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-destructive" />
      case 'completed': return <Clock className="h-4 w-4 text-blue-500" />
      default: return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Master Reservations</h1>
        <p className="text-muted-foreground mt-2">Oversee and manage every guest journey in your hotel.</p>
      </div>

      <Card className="rounded-3xl border-border/40 bg-card/50 backdrop-blur-sm shadow-2xl shadow-primary/5 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 py-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">All Reservations</CardTitle>
              <CardDescription>Comprehensive list of all booking activities</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full px-4 py-1">
              {bookings?.length || 0} Total Bookings
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="font-bold py-6 pl-8">Guest</TableHead>
                <TableHead className="font-bold">Stay Dates</TableHead>
                <TableHead className="font-bold">Total Price</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                    No bookings found.
                  </TableCell>
                </TableRow>
              ) : (
                bookings?.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                    <TableCell className="py-6 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{booking.guestName || 'Unknown Guest'}</span>
                          <span className="text-xs text-muted-foreground">{booking.guestEmail ?? ''}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {booking.checkIn ? format(new Date(booking.checkIn), 'MMM dd, y') : 'N/A'} -
                            {booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, y') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-black text-lg">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        ${booking.totalPrice}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-full gap-1.5 px-3 py-1 capitalize border-none",
                          booking.status === 'confirmed' && "bg-emerald-500/10 text-emerald-600",
                          booking.status === 'cancelled' && "bg-destructive/10 text-destructive",
                          booking.status === 'completed' && "bg-blue-500/10 text-blue-600"
                        )}
                      >
                        {getStatusIcon(booking.status || 'confirmed')}
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Manage booking" className="h-10 w-10 rounded-xl hover:bg-muted transition-all">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-border/40 shadow-xl">
                          <DropdownMenuItem
                            className="rounded-xl focus:bg-emerald-500 focus:text-white"
                            onClick={() => statusMutation.mutate({ data: { id: booking.id, status: 'confirmed' } })}
                          >
                            Mark as Confirmed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-xl focus:bg-blue-500 focus:text-white"
                            onClick={() => statusMutation.mutate({ data: { id: booking.id, status: 'completed' } })}
                          >
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-xl focus:bg-destructive focus:text-white"
                            onClick={() => statusMutation.mutate({ data: { id: booking.id, status: 'cancelled' } })}
                          >
                            Mark as Cancelled
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
