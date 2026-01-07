import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Search, X, Calendar as CalendarIcon, Filter } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export type BookingFilters = {
    search?: string
    dateRange?: { from?: Date; to?: Date }
    minPrice?: number
    maxPrice?: number
    status?: ('confirmed' | 'cancelled' | 'completed')[]
}

interface AdvancedSearchFilterProps {
    onFilterChange: (filters: BookingFilters) => void
    initialFilters?: BookingFilters
    className?: string
}

export function AdvancedSearchFilter({ onFilterChange, initialFilters, className }: AdvancedSearchFilterProps) {
    const [filters, setFilters] = useState<BookingFilters>(initialFilters || {})
    const [isOpen, setIsOpen] = useState(false)

    // Debounce search text
    useEffect(() => {
        const timer = setTimeout(() => {
            onFilterChange(filters)
        }, 500)
        return () => clearTimeout(timer)
    }, [filters, onFilterChange])

    const updateFilter = (key: keyof BookingFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const toggleStatus = (status: 'confirmed' | 'cancelled' | 'completed') => {
        const current = filters.status || []
        const next = current.includes(status)
            ? current.filter(s => s !== status)
            : [...current, status]
        updateFilter('status', next)
    }

    const clearFilters = () => {
        setFilters({})
        onFilterChange({})
    }

    const activeFilterCount = [
        filters.search,
        filters.dateRange?.from,
        filters.minPrice,
        filters.maxPrice,
        (filters.status?.length || 0) > 0
    ].filter(Boolean).length

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search guest name or email..."
                        className="pl-9 h-10 rounded-xl"
                        value={filters.search || ''}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                </div>
                <Button
                    variant={isOpen ? "secondary" : "outline"}
                    className="h-10 rounded-xl border-dashed gap-2"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 min-w-5 rounded-md text-[10px]">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
                {activeFilterCount > 0 && (
                    <Button variant="ghost" className="h-10 px-2 text-muted-foreground hover:text-destructive" onClick={clearFilters}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {isOpen && (
                <div className="p-4 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Date Range</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl", !filters.dateRange && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.dateRange?.from ? (
                                        filters.dateRange.to ? (
                                            <>
                                                {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                                                {format(filters.dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(filters.dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={filters.dateRange?.from}
                                    selected={filters.dateRange}
                                    onSelect={(range) => updateFilter('dateRange', range)}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Price Range</label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Min"
                                className="rounded-xl"
                                value={filters.minPrice || ''}
                                onChange={(e) => updateFilter('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                            <Input
                                type="number"
                                placeholder="Max"
                                className="rounded-xl"
                                value={filters.maxPrice || ''}
                                onChange={(e) => updateFilter('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Booking Status</label>
                        <div className="flex gap-2">
                            {(['confirmed', 'cancelled', 'completed'] as const).map(status => {
                                const isActive = filters.status?.includes(status)
                                return (
                                    <Button
                                        key={status}
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "rounded-xl capitalize transition-all border-dashed",
                                            isActive && "border-solid bg-primary/10 text-primary border-primary"
                                        )}
                                        onClick={() => toggleStatus(status)}
                                    >
                                        {status}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
