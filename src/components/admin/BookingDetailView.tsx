import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { User, Calendar, CreditCard, CheckCircle2, XCircle, Clock, Bed, Utensils, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookingDetailViewProps {
    isOpen: boolean
    onClose: () => void
    booking: any // We'll type this properly based on the return from getBookingDetails
}

export function BookingDetailView({ isOpen, onClose, booking }: BookingDetailViewProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            case 'cancelled': return <XCircle className="h-4 w-4 text-destructive" />
            case 'completed': return <Clock className="h-4 w-4 text-blue-500" />
            default: return null
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
                <DialogHeader className="bg-primary/5 p-6 border-b border-border/40 sm:text-left">
                    <div className="flex justify-between items-start w-full">
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                                Reservation Details
                                {booking && (
                                    <Badge variant="outline" className="rounded-full font-normal text-xs bg-background/50 backdrop-blur-md">
                                        #{booking.id.slice(0, 8)}
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription className="mt-1 flex items-center gap-2 text-muted-foreground/80">
                                {booking ? `Created on ${format(new Date(booking.createdAt), "PPP p")}` : 'Fetching details...'}
                            </DialogDescription>
                        </div>
                        {booking && (
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "rounded-full gap-1.5 px-3 py-1 capitalize border-none text-sm font-bold shrink-0 ml-4",
                                    booking.status === 'confirmed' && "bg-emerald-500/10 text-emerald-600",
                                    booking.status === 'cancelled' && "bg-destructive/10 text-destructive",
                                    booking.status === 'completed' && "bg-blue-500/10 text-blue-600"
                                )}
                            >
                                {getStatusIcon(booking.status)}
                                {booking.status}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto">
                    {!booking ? (
                        <div className="h-48 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="animate-pulse">Loading reservation itinerary...</p>
                        </div>
                    ) : (
                        <>
                            {/* Guest Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/20">
                                    <div className="h-10 w-10 text-primary bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Guest</p>
                                        <p className="font-bold truncate">{booking.guestName || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{booking.guestEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/20">
                                    <div className="h-10 w-10 text-orange-600 bg-orange-500/10 rounded-full flex items-center justify-center shrink-0">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Stay Dates</p>
                                        <p className="font-bold">
                                            {format(new Date(booking.checkIn), "MMM dd")} - {format(new Date(booking.checkOut), "MMM dd, y")}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Check-in at 2:00 PM</p>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest">
                                    <CreditCard className="h-4 w-4" />
                                    Itinerary Breakdown
                                </h3>
                                <div className="space-y-3">
                                    {booking.items?.map((item: any, idx: number) => {
                                        const isRoom = item.type === 'room'
                                        return (
                                            <div key={idx} className="flex justify-between items-center group p-3 rounded-2xl hover:bg-muted/30 transition-all border border-transparent hover:border-border/40 hover:shadow-sm">
                                                <div className="flex gap-4 items-center min-w-0">
                                                    <div className={cn(
                                                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                                                        isRoom ? "bg-primary/20 text-primary" :
                                                            item.type === 'activity' ? "bg-purple-500/20 text-purple-600" : "bg-orange-500/20 text-orange-600"
                                                    )}>
                                                        {isRoom ? <Bed className="h-6 w-6" /> :
                                                            item.type === 'activity' ? <Sparkles className="h-6 w-6" /> : <Utensils className="h-6 w-6" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold truncate">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {isRoom ? 'Room Stay' : item.type === 'activity' ? 'Experience' : 'Dining'} • {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground/70 bg-muted/80 px-1.5 py-0.5 rounded-md inline-block mt-1 font-medium">
                                                            {item.startDate ? format(new Date(item.startDate), 'MMM dd') : 'N/A'}
                                                            {item.endDate && item.startDate !== item.endDate ? ` - ${format(new Date(item.endDate), 'MMM dd')}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="font-black text-lg">${item.price}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="border-t border-border/40 pt-6 flex justify-between items-end">
                                <div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Total Amount Paid</span>
                                    <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">Prepaid / Credit Card</Badge>
                                </div>
                                <span className="text-4xl font-black tracking-tighter text-primary">${booking.totalPrice}</span>
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter className="p-4 bg-muted/30 border-t border-border/20">
                    <Button onClick={onClose} variant="secondary" className="rounded-xl w-full h-12 font-bold hover:bg-muted/50 transition-colors">
                        Close Details
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
