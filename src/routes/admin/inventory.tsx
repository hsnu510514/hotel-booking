import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Loader2, Bed, Utensils, Sparkles, AlertCircle, CheckCircle2, XCircle, User, ArrowRight, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { cn } from '@/lib/utils'

import { getDailyInventoryStatus, getBookingsForResource, getBookingDetails, getDailyManifest } from '@/utils/admin'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BookingDetailView } from '@/components/admin/BookingDetailView'

export const Route = createFileRoute('/admin/inventory')({
    component: InventoryDashboard,
})

function InventoryDashboard() {
    const [date, setDate] = useState<Date>(new Date())
    const [activeTab, setActiveTab] = useState<'room' | 'meal' | 'activity'>('room')
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null)
    const [detailBookingId, setDetailBookingId] = useState<string | null>(null)

    // 1. Fetch Inventory Status
    const { data: inventory, isLoading: loadingInventory, isError, error } = useQuery({
        queryKey: ['inventory-status', date, activeTab],
        queryFn: () => getDailyInventoryStatus({ data: { date, type: activeTab } }),
    })

    // 2. Fetch Bookings for Selected Resource
    const { data: resourceBookings, isLoading: loadingResourceBookings } = useQuery({
        queryKey: ['resource-bookings', date, selectedResourceId, activeTab],
        queryFn: () => selectedResourceId
            ? getBookingsForResource({ data: { date, resourceId: selectedResourceId, type: activeTab } })
            : null,
        enabled: !!selectedResourceId
    })

    // 3. Fetch Booking Details for Modal
    const { data: detailedBooking } = useQuery({
        queryKey: ['booking-detail', detailBookingId],
        queryFn: () => detailBookingId ? getBookingDetails({ data: { id: detailBookingId } }) : null,
        enabled: !!detailBookingId
    })

    const tabs = [
        { id: 'room', label: 'Rooms', icon: Bed },
        { id: 'meal', label: 'Dining', icon: Utensils },
        { id: 'activity', label: 'Experiences', icon: Sparkles },
    ] as const

    const handleExportPDF = async () => {
        if (!resourceBookings || !inventory) return

        const doc = new jsPDF()

        // Load Custom Font
        try {
            const fontUrl = '/fonts/NotoSansTC-Regular.ttf'
            const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer())

            // Convert ArrayBuffer to Base64 (Browser compatible)
            let binary = '';
            const bytes = new Uint8Array(fontBytes);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const fontBase64 = window.btoa(binary);

            const fontFileName = 'NotoSansTC-Regular.ttf'
            doc.addFileToVFS(fontFileName, fontBase64)
            doc.addFont(fontFileName, 'NotoSansTC', 'normal')
            doc.setFont('NotoSansTC')
        } catch (e) {
            console.error("Failed to load font", e)
        }

        const resourceName = inventory.find(i => i.id === selectedResourceId)?.name || 'Resource'
        const dateStr = format(date, 'PPP')

        // Title
        doc.setFontSize(18)
        doc.text(`${resourceName} - Guest Manifest`, 14, 20)
        doc.setFontSize(12)
        doc.text(dateStr, 14, 30)

        // Table
        const tableData = resourceBookings.map(b => [
            b.guestName || 'Unknown',
            b.quantity,
            b.guestEmail || 'No Email',
            b.status,
            `${format(new Date(b.checkIn), 'MMM dd')} - ${format(new Date(b.checkOut), 'MMM dd')}`
        ])

        autoTable(doc, {
            startY: 40,
            head: [['Guest Name', 'Pax', 'Email', 'Status', 'Dates']],
            body: tableData,
            foot: [['Total', resourceBookings.reduce((sum, b) => sum + b.quantity, 0), '', '', '']],
            styles: { font: 'NotoSansTC', fontStyle: 'normal' },
        })

        doc.save(`${resourceName.replace(/\s+/g, '_')}_${format(date, 'yyyy-MM-dd')}_Manifest.pdf`)
    }

    const handleExportAllPDF = async () => {
        const doc = new jsPDF()

        // Load Custom Font
        try {
            const fontUrl = '/fonts/NotoSansTC-Regular.ttf'
            const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer())

            // Convert ArrayBuffer to Base64 (Browser compatible)
            let binary = '';
            const bytes = new Uint8Array(fontBytes);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const fontBase64 = window.btoa(binary);

            const fontFileName = 'NotoSansTC-Regular.ttf'
            doc.addFileToVFS(fontFileName, fontBase64)
            doc.addFont(fontFileName, 'NotoSansTC', 'normal')
            doc.setFont('NotoSansTC')
        } catch (e) {
            console.error("Failed to load font", e)
        }

        const dateStr = format(date, 'PPP')
        doc.setFontSize(22)
        doc.text(`Daily Manifest - ${tabs.find(t => t.id === activeTab)?.label}`, 14, 20)
        doc.setFontSize(14)
        doc.text(dateStr, 14, 30)

        let startY = 40

        // We need to fetch the data on demand
        // Since we can't call hooks conditionally, we'll fetch explicitly
        try {
            const allBookings = await getDailyManifest({ data: { date, type: activeTab } })

            // Group by resource
            const grouped = allBookings.reduce((acc, curr) => {
                if (!acc[curr.resourceName]) acc[curr.resourceName] = []
                acc[curr.resourceName].push(curr)
                return acc
            }, {} as Record<string, typeof allBookings>)

            for (const [resName, bookings] of Object.entries(grouped)) {
                // Check page break
                if (startY > 250) {
                    doc.addPage()
                    startY = 20
                }

                doc.setFontSize(16)
                doc.text(resName, 14, startY)
                startY += 10

                const tableData = bookings.map(b => [
                    b.guestName || 'Unknown',
                    b.quantity,
                    b.guestEmail || 'No Email',
                    b.status,
                ])

                autoTable(doc, {
                    startY,
                    head: [['Guest Name', 'Pax', 'Email', 'Status']],
                    body: tableData,
                    foot: [['Total', bookings.reduce((sum, b) => sum + b.quantity, 0), '', '']],
                    styles: { font: 'NotoSansTC', fontStyle: 'normal' },
                    margin: { top: 10 },
                    didDrawPage: (data) => {
                        // Update startY for next table
                        startY = data.cursor?.y ? data.cursor.y + 20 : 0
                    }
                })
                // autoTable updates the cursor but we need to grab it. 
                // The logic above in didDrawPage handles it mostly, 
                // but simpler to just use doc.lastAutoTable.finalY
                // @ts-ignore
                startY = doc.lastAutoTable.finalY + 15
            }

            doc.save(`Full_Manifest_${activeTab}_${format(date, 'yyyy-MM-dd')}.pdf`)

        } catch (err) {
            console.error("Failed to export all", err)
            alert("Failed to generate PDF")
        }
    }

    const totalGuests = resourceBookings?.reduce((sum, b) => sum + b.quantity, 0) || 0
    const totalDailyBookings = inventory?.reduce((sum, item) => sum + item.bookedCount, 0) || 0

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div>
                <h1 className="text-4xl font-black tracking-tight">Daily Inventory</h1>
                <p className="text-muted-foreground mt-2">Track real-time availability and resource usage per day.</p>
            </div>

            <div className="flex flex-col gap-4 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 -my-4 px-1 rounded-b-2xl">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2">
                    {tabs.map(tab => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? 'default' : 'outline'}
                            className={cn(
                                "rounded-full px-6 h-12 transition-all",
                                activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg scale-105" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => {
                                setActiveTab(tab.id)
                                setSelectedResourceId(null) // Reset selection on tab change
                            }}
                        >
                            <tab.icon className="mr-2 h-4 w-4" />
                            {tab.label}
                        </Button>
                    ))}
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Viewing date:</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal rounded-xl h-12 shadow-sm",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => {
                                    if (d) setDate(d)
                                    setSelectedResourceId(null) // Reset selection on date change
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inventory List */}
                <div className="lg:col-span-2">
                    <Card className="rounded-3xl border-border/40 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5 overflow-hidden min-h-[500px]">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-6">
                            <CardTitle className="text-xl font-bold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    Available Resources
                                    {loadingInventory && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="gap-2 bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-all h-9 mt-1"
                                    disabled={totalDailyBookings === 0}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleExportAllPDF()
                                    }}
                                >
                                    <Download className="h-4 w-4" />
                                    Export All
                                </Button>
                            </CardTitle>
                            <CardDescription>Select a resource to view detailed bookings.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border/40">
                                        <TableHead className="font-bold py-5 pl-8">Name</TableHead>
                                        <TableHead className="font-bold text-center">Total</TableHead>
                                        <TableHead className="font-bold text-center">Booked</TableHead>
                                        <TableHead className="font-bold text-center pr-8">Remaining</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingInventory ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-64 text-center">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : isError ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-64 text-center text-destructive">
                                                <XCircle className="h-8 w-8 mx-auto mb-2" />
                                                <p>Error loading inventory: {error?.message}</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : inventory?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-64 text-center text-muted-foreground">
                                                No resources found.
                                            </TableCell>
                                        </TableRow>
                                    ) : inventory?.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            className={cn(
                                                "cursor-pointer transition-colors border-border/40",
                                                selectedResourceId === item.id ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/30"
                                            )}
                                            onClick={() => setSelectedResourceId(item.id)}
                                        >
                                            <TableCell className="py-4 pl-8 font-medium">
                                                {item.name}
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-muted-foreground">
                                                {item.totalInventory}
                                            </TableCell>
                                            <TableCell className="text-center font-mono">
                                                {item.bookedCount}
                                            </TableCell>
                                            <TableCell className="pr-8">
                                                <div className="flex justify-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "rounded-md min-w-[2.5rem] justify-center font-bold",
                                                            item.remainingCount <= 0 ? "bg-destructive text-destructive-foreground border-destructive" :
                                                                item.remainingCount < 3 ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                                                                    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                        )}
                                                    >
                                                        {item.remainingCount}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card >
                </div >

                {/* Drill-down View */}
                < div className="lg:col-span-1" >
                    <Card className={cn(
                        "rounded-3xl border-border/40 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5 overflow-hidden h-full min-h-[500px] transition-all duration-500 flex flex-col",
                        selectedResourceId ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none absolute lg:static"
                    )}>
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold">
                                        Guest List
                                    </CardTitle>
                                    <CardDescription>
                                        {resourceBookings?.length || 0} booking(s) &bull; {totalGuests} guests
                                    </CardDescription>
                                </div>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={handleExportPDF}
                                    disabled={totalGuests === 0}
                                    title="Export Manifest PDF"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto max-h-[600px] flex-1">
                            {loadingResourceBookings ? (
                                <div className="flex h-40 items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : resourceBookings?.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No active bookings for this day.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border/40">
                                            <TableHead className="pl-4">Guest</TableHead>
                                            <TableHead className="text-center w-12">Pax</TableHead>
                                            <TableHead className="w-8"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {resourceBookings?.map((booking) => (
                                            <TableRow
                                                key={booking.id}
                                                className="cursor-pointer hover:bg-muted/40 border-border/40"
                                                onClick={() => setDetailBookingId(booking.id)}
                                            >
                                                <TableCell className="pl-4 py-3">
                                                    <div className="font-medium text-sm">{booking.guestName}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[120px]" title={booking.guestEmail || ''}>
                                                        {booking.guestEmail}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono">
                                                    {booking.quantity}
                                                </TableCell>
                                                <TableCell>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Empty State Placeholder when nothing selected */}
                    {
                        !selectedResourceId && (
                            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 text-muted-foreground h-full min-h-[400px] border-2 border-dashed border-border/40 rounded-3xl lg:block hidden">
                                <AlertCircle className="h-12 w-12 mx-auto opacity-20" />
                                <p>Select a resource from the left to view the guest list.</p>
                            </div>
                        )
                    }
                </div >
            </div >

            <BookingDetailView
                isOpen={!!detailBookingId}
                onClose={() => setDetailBookingId(null)}
                booking={detailedBooking}
            />
        </div >
    )
}
