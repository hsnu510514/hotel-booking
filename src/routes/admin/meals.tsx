import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMeals } from '@/utils/resources'
import { upsertMeal, deleteMeal } from '@/utils/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Utensils, DollarSign, Image as ImageIcon, Loader2, PackageSearch } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'

export const Route = createFileRoute('/admin/meals')({
    component: AdminMealsPage,
})

function AdminMealsPage() {
    const queryClient = useQueryClient()
    const { data: meals, isLoading } = useQuery({
        queryKey: ['meals'],
        queryFn: () => getMeals(),
    })

    const [editingMeal, setEditingMeal] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const saveMutation = useMutation({
        mutationFn: upsertMeal,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meals'] })
            toast.success('Meal saved successfully')
            setIsDialogOpen(false)
            setEditingMeal(null)
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to save meal')
        }
    })

    const removeMutation = useMutation({
        mutationFn: deleteMeal,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meals'] })
            toast.success('Meal deleted')
        }
    })

    const handleEdit = (meal: any) => {
        setEditingMeal(meal)
        setIsDialogOpen(true)
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this meal option?')) {
            removeMutation.mutate({ data: { id } })
        }
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const data = {
            id: editingMeal?.id,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price: formData.get('price') as string,
            totalInventory: parseInt(formData.get('totalInventory') as string),
            imageUrl: formData.get('imageUrl') as string,
        }
        saveMutation.mutate({ data })
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Gourmet Collections</h1>
                    <p className="text-muted-foreground mt-2">Curate the finest dining experiences for your guests.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="rounded-2xl gap-2 shadow-xl shadow-primary/20 bg-orange-500 hover:bg-orange-600 border-none"
                            onClick={() => {
                                setEditingMeal(null)
                                setIsDialogOpen(true)
                            }}
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add New Dish</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px] rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">
                                {editingMeal ? 'Edit Dish' : 'Add New Dish'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dish Name</label>
                                <Input name="name" defaultValue={editingMeal?.name} placeholder="e.g. Black Truffle Pasta" required className="rounded-xl h-12" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Price</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input name="price" defaultValue={editingMeal?.price} placeholder="0.00" required className="rounded-xl h-12 pl-10" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Daily Inventory</label>
                                    <div className="relative">
                                        <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input name="totalInventory" type="number" defaultValue={editingMeal?.totalInventory} required className="rounded-xl h-12 pl-10" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Image URL</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input name="imageUrl" defaultValue={editingMeal?.imageUrl} placeholder="https://..." className="rounded-xl h-12 pl-10" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                                <Textarea name="description" defaultValue={editingMeal?.description} placeholder="Describe the culinary masterpiece..." className="rounded-xl min-h-[100px]" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold bg-orange-500 hover:bg-orange-600 border-none" disabled={saveMutation.isPending}>
                                    {saveMutation.isPending ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        editingMeal ? 'Update Dish' : 'Create Dish'
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
                            <TableHead className="w-[100px] font-bold py-6">Plate</TableHead>
                            <TableHead className="font-bold">Dish Name</TableHead>
                            <TableHead className="font-bold">Inventory</TableHead>
                            <TableHead className="font-bold">Price</TableHead>
                            <TableHead className="text-right font-bold pr-8">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                                        <span className="font-medium animate-pulse">Loading Menu...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : meals?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                        <Utensils className="h-12 w-12 opacity-20" />
                                        <p className="text-lg font-medium">The kitchen is empty. Add your first signature dish.</p>
                                        <Button variant="outline" className="rounded-xl" onClick={() => setIsDialogOpen(true)}>Start Cooking</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            meals?.map((meal) => (
                                <TableRow key={meal.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                                    <TableCell className="py-4">
                                        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border/50 shadow-inner">
                                            <img src={meal.imageUrl || '/placeholder-meal.png'} className="h-full w-full object-cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-lg">{meal.name}</span>
                                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">{meal.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium">
                                            <PackageSearch className="h-4 w-4 text-muted-foreground" />
                                            {meal.totalInventory} Servings
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-lg font-black text-orange-500">${meal.price}</span>
                                        <span className="text-[10px] text-muted-foreground block font-bold leading-none uppercase">Per Serving</span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" aria-label="Edit meal" className="h-10 w-10 rounded-xl hover:bg-orange-500/10 hover:text-orange-500 transition-all" onClick={() => handleEdit(meal)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" aria-label="Delete meal" className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => handleDelete(meal.id)}>
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
