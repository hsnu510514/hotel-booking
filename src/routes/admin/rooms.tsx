import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRooms } from '@/utils/resources'
import { upsertRoom, deleteRoom } from '@/utils/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Bed, Users, DollarSign, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'

export const Route = createFileRoute('/admin/rooms')({
  component: AdminRoomsPage,
})

function AdminRoomsPage() {
  const queryClient = useQueryClient()
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => getRooms(),
  })

  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const saveMutation = useMutation({
    mutationFn: upsertRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Room saved successfully')
      setIsDialogOpen(false)
      setEditingRoom(null)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save room')
    }
  })

  const removeMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Room deleted')
    }
  })

  const handleEdit = (room: any) => {
    setEditingRoom(room)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this room?')) {
      removeMutation.mutate({ data: { id } })
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      id: editingRoom?.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      pricePerNight: formData.get('pricePerNight') as string,
      capacity: parseInt(formData.get('capacity') as string),
      imageUrl: formData.get('imageUrl') as string,
    }
    saveMutation.mutate({ data })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Room Inventory</h1>
          <p className="text-muted-foreground mt-2">Manage your hotel's luxury suites and pricing.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="rounded-2xl gap-2 shadow-xl shadow-primary/20"
              onClick={() => {
                setEditingRoom(null)
                setIsDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Add New Room</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Room Name</label>
                <Input name="name" defaultValue={editingRoom?.name} placeholder="e.g. Royal Penthouse" required className="rounded-xl h-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Price / Night</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input name="pricePerNight" defaultValue={editingRoom?.pricePerNight} placeholder="0.00" required className="rounded-xl h-12 pl-10" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Capacity</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input name="capacity" type="number" defaultValue={editingRoom?.capacity} required className="rounded-xl h-12 pl-10" />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Image URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input name="imageUrl" defaultValue={editingRoom?.imageUrl} placeholder="https://..." className="rounded-xl h-12 pl-10" />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                <Textarea name="description" defaultValue={editingRoom?.description} placeholder="Describe the luxury details..." className="rounded-xl min-h-[100px]" />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    editingRoom ? 'Update Room' : 'Create Room'
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
              <TableHead className="w-[100px] font-bold py-6">Image</TableHead>
              <TableHead className="font-bold">Room Name</TableHead>
              <TableHead className="font-bold">Capacity</TableHead>
              <TableHead className="font-bold">Price</TableHead>
              <TableHead className="text-right font-bold pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <span className="font-medium animate-pulse">Loading Inventory...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : rooms?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <Bed className="h-12 w-12 opacity-20" />
                    <p className="text-lg font-medium">No rooms found in our luxury collection.</p>
                    <Button variant="outline" className="rounded-xl" onClick={() => setIsDialogOpen(true)}>Add One Now</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rooms?.map((room) => (
                <TableRow key={room.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                  <TableCell className="py-4">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border/50 shadow-inner">
                      <img src={room.imageUrl || '/placeholder-room.png'} className="h-full w-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-lg">{room.name}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">{room.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {room.capacity} Guests
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-lg font-black text-primary">${room.pricePerNight}</span>
                    <span className="text-[10px] text-muted-foreground block font-bold leading-none">PER NIGHT</span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" aria-label="Edit room" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => handleEdit(room)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete room" className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => handleDelete(room.id)}>
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
