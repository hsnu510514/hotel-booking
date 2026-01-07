import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllBookings, updateBookingStatus, getBookingDetails, getBookingItems } from '@/utils/admin'
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
import { MoreHorizontal, Calendar, User, CreditCard, Loader2, CheckCircle2, XCircle, Clock, Bed, Utensils, Sparkles, Eye, Hash } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { AdvancedSearchFilter, type BookingFilters } from '@/components/admin/AdvancedSearchFilter'
import { BookingDetailView } from '@/components/admin/BookingDetailView'

export const Route = createFileRoute('/admin/bookings')({
  component: AdminBookingsPage,
})

function AdminBookingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'all' | 'room' | 'meal' | 'activity'>('all')
  const [filters, setFilters] = useState<BookingFilters>({})
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  const isAllTab = activeTab === 'all'

  // Fetch Bookings (for "All" tab only)
  const { data: bookings, isLoading: loadingBookings, isFetching: fetchingBookings, isError: bookingsError, error: bookingsErrorMsg } = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: () => getAllBookings({ data: { type: 'all', ...filters } }),
    enabled: isAllTab
  })

  // Fetch Booking Items (for resource tabs)
  const { data: bookingItems, isLoading: loadingItems, isFetching: fetchingItems, isError: itemsError, error: itemsErrorMsg } = useQuery({
    queryKey: ['admin-booking-items', activeTab, filters],
    queryFn: () => getBookingItems({ data: { type: activeTab as 'room' | 'meal' | 'activity', search: filters.search, dateRange: filters.dateRange } }),
    enabled: !isAllTab
  })

  // Fetch Details when a booking is selected
  const { data: detailedBooking, error: detailsError } = useQuery({
    queryKey: ['booking-detail', selectedBookingId],
    queryFn: () => selectedBookingId ? getBookingDetails({ data: { id: selectedBookingId } }) : null,
    enabled: !!selectedBookingId
  })

  // Show error toast if details fail
  if (detailsError) {
    toast.error('Failed to load reservation details')
  }

  const statusMutation = useMutation({
    mutationFn: updateBookingStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-booking-items'] })
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] })
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

  const isLoading = isAllTab ? loadingBookings : loadingItems
  const isFetching = isAllTab ? fetchingBookings : fetchingItems
  const isError = isAllTab ? bookingsError : itemsError
  const error = isAllTab ? bookingsErrorMsg : itemsErrorMsg
  const dataCount = isAllTab ? (bookings?.length || 0) : (bookingItems?.length || 0)

  // Error handling AFTER all hooks
  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-destructive">
        <XCircle className="h-12 w-12" />
        <div className="text-center">
          <h3 className="font-bold text-lg">Failed to load data</h3>
          <p className="text-sm opacity-80">{error?.message || 'Unknown error occurred'}</p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
          Retry
        </Button>
      </div>
    )
  }

  const tabs = [
    { id: 'all', label: 'All Reservations', icon: undefined },
    { id: 'room', label: 'Rooms', icon: Bed },
    { id: 'meal', label: 'Dining', icon: Utensils },
    { id: 'activity', label: 'Experiences', icon: Sparkles },
  ] as const

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Master Reservations</h1>
        <p className="text-muted-foreground mt-2">Oversee and manage every guest journey in your hotel.</p>
      </div>

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              className={cn(
                "rounded-full px-6 h-10 transition-all",
                activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg scale-105" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon && <tab.icon className="mr-2 h-4 w-4" />}
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Filter Bar */}
        <AdvancedSearchFilter
          onFilterChange={setFilters}
          initialFilters={filters}
          className="w-full"
        />

        <Card className="rounded-3xl border-border/40 bg-card/50 backdrop-blur-sm shadow-2xl shadow-primary/5 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 py-6 min-h-[80px] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {tabs.find(t => t.id === activeTab)?.label}
                {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${dataCount} ${isAllTab ? 'bookings' : 'items'} found`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isAllTab ? (
              /* ALL RESERVATIONS TABLE */
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : bookings?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                        No bookings found for current criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings?.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="hover:bg-muted/30 border-border/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedBookingId(booking.id)}
                      >
                        <TableCell className="py-6 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <User className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground group-hover:text-primary transition-colors">{booking.guestName || 'Unknown Guest'}</span>
                              <span className="text-xs text-muted-foreground">{booking.guestEmail ?? ''}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>
                              {booking.checkIn ? format(new Date(booking.checkIn), 'MMM dd, y') : 'N/A'} -
                              {booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, y') : 'N/A'}
                            </span>
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
                        <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted" onClick={() => setSelectedBookingId(booking.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Manage booking" className="h-10 w-10 rounded-xl hover:bg-muted">
                                  <MoreHorizontal className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl border-border/40 shadow-xl z-50">
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              /* BOOKING ITEMS TABLE (Rooms/Meals/Activities) */
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="font-bold py-6 pl-8">Item Name</TableHead>
                    <TableHead className="font-bold">Guest</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Qty</TableHead>
                    <TableHead className="font-bold">Price</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : bookingItems?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center text-muted-foreground">
                        No {activeTab} items found for current criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookingItems?.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/30 border-border/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedBookingId(item.bookingId)}
                      >
                        <TableCell className="py-4 pl-8">
                          <span className="font-bold">{item.itemName}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{item.guestName || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{item.guestEmail || ''}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {item.startDate ? format(new Date(item.startDate), 'MMM dd') : 'N/A'}
                            {item.endDate && item.startDate !== item.endDate && ` - ${format(new Date(item.endDate), 'MMM dd')}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full">{item.quantity}x</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">${item.price}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "rounded-full gap-1.5 px-3 py-1 capitalize border-none text-xs",
                              item.bookingStatus === 'confirmed' && "bg-emerald-500/10 text-emerald-600",
                              item.bookingStatus === 'cancelled' && "bg-destructive/10 text-destructive",
                              item.bookingStatus === 'completed' && "bg-blue-500/10 text-blue-600"
                            )}
                          >
                            {getStatusIcon(item.bookingStatus || 'confirmed')}
                            {item.bookingStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <BookingDetailView
        isOpen={!!selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
        booking={detailedBooking}
      />
    </div>
  )
}
