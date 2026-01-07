import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getActivities } from '@/utils/resources'
import { upsertActivity, deleteActivity } from '@/utils/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Sparkles, DollarSign, Image as ImageIcon, Loader2, Clock, PackageSearch } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'

export const Route = createFileRoute('/admin/activities')({
    component: AdminActivitiesPage,
})

function AdminActivitiesPage() {
    const queryClient = useQueryClient()
    const { data: activities, isLoading } = useQuery({
        queryKey: ['activities'],
        queryFn: () => getActivities(),
    })

    const [editingActivity, setEditingActivity] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const saveMutation = useMutation({
        mutationFn: upsertActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] })
            toast.success('Activity saved successfully')
            setIsDialogOpen(false)
            setEditingActivity(null)
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to save activity')
        }
    })

    const removeMutation = useMutation({
        mutationFn: deleteActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] })
            toast.success('Activity deleted')
        }
    })

    const handleEdit = (activity: any) => {
        setEditingActivity(activity)
        setIsDialogOpen(true)
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this activity?')) {
            removeMutation.mutate({ data: { id } })
        }
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const data = {
            id: editingActivity?.id,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price: formData.get('price') as string,
            startTime: formData.get('startTime') as string,
            endTime: formData.get('endTime') as string,
            totalInventory: parseInt(formData.get('totalInventory') as string),
            imageUrl: formData.get('imageUrl') as string,
        }
        saveMutation.mutate({ data })
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Guest Experiences</h1>
                    <p className="text-muted-foreground mt-2">Design unforgettable adventures and wellness sessions.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="rounded-2xl gap-2 shadow-xl shadow-primary/20 bg-purple-600 hover:bg-purple-700 border-none px-6"
                            onClick={() => {
                                setEditingActivity(null)
                                setIsDialogOpen(true)
                            }}
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create Experience</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px] rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">
                                {editingActivity ? 'Edit Experience' : 'New Experience'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Activity Name</label>
                                <Input name="name" defaultValue={editingActivity?.name} placeholder="e.g. Midnight Sea Kayaking" required className="rounded-xl h-12" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Price</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input name="price" defaultValue={editingActivity?.price} placeholder="0.00" required className="rounded-xl h-12 pl-10" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Start Time</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input name="startTime" type="time" defaultValue={editingActivity?.startTime} required className="rounded-xl h-12 pl-10" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">End Time</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input name="endTime" type="time" defaultValue={editingActivity?.endTime} required className="rounded-xl h-12 pl-10" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Places</label>
                                    <div className="relative">
                                        <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input name="totalInventory" type="number" defaultValue={editingActivity?.totalInventory} required className="rounded-xl h-12 pl-10" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Banner Image</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input name="imageUrl" defaultValue={editingActivity?.imageUrl} placeholder="https://..." className="rounded-xl h-12 pl-10" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                                <Textarea name="description" defaultValue={editingActivity?.description} placeholder="Paint a picture of the experience..." className="rounded-xl min-h-[100px]" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold bg-purple-600 hover:bg-purple-700 border-none" disabled={saveMutation.isPending}>
                                    {saveMutation.isPending ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        editingActivity ? 'Update Experience' : 'Launch Experience'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="rounded-3xl border-border/40 bg-card/50 backdrop-blur-sm shadow-2xl shadow-primary/5 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border/40">
                            <TableHead className="py-6 font-bold">Visual</TableHead>
                            <TableHead className="font-bold">Experience</TableHead>
                            <TableHead className="font-bold">Time Slot</TableHead>
                            <TableHead className="font-bold">Inventory</TableHead>
                            <TableHead className="font-bold">Price</TableHead>
                            <TableHead className="text-right font-bold pr-8">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                                        <span className="font-medium animate-pulse">Loading Experiences...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : activities?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                        <Sparkles className="h-12 w-12 opacity-20" />
                                        <p className="text-lg font-medium">No adventures planned yet. Inspire your guests.</p>
                                        <Button variant="outline" className="rounded-xl" onClick={() => setIsDialogOpen(true)}>New Adventure</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            activities?.map((activity) => (
                                <TableRow key={activity.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                                    <TableCell className="py-4">
                                        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border/50 shadow-inner">
                                            <img src={activity.imageUrl || '/placeholder-activity.png'} className="h-full w-full object-cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-lg">{activity.name}</span>
                                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">{activity.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            {activity.startTime} - {activity.endTime}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium">
                                            <PackageSearch className="h-4 w-4 text-muted-foreground" />
                                            {activity.totalInventory} Spots
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-lg font-black text-purple-500">${activity.price}</span>
                                        <span className="text-[10px] text-muted-foreground block font-bold leading-none uppercase">Per Person</span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" aria-label="Edit activity" className="h-10 w-10 rounded-xl hover:bg-purple-500/10 hover:text-purple-500 transition-all" onClick={() => handleEdit(activity)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" aria-label="Delete activity" className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => handleDelete(activity.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
