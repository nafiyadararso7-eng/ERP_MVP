import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useT } from '#/lib/i18n'
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct, type ProductInput } from '#/lib/api/products'
import { useCategories } from '#/lib/api/categories'
import { formatETB } from '#/lib/format'
import { Card, CardContent } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Plus, Search, Package, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/inventory')({
  component: InventoryPage,
})

function InventoryPage() {
  const { t } = useT()
  const { data: products, isLoading } = useProducts()
  const { data: categories } = useCategories('product')
  const addProduct = useAddProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)

  const [form, setForm] = useState<ProductInput>({
    name: '', sku: '', category_id: null, quantity: 0,
    buying_price: 0, selling_price: 0, low_stock_threshold: 5,
  })

  const resetForm = () => {
    setForm({ name: '', sku: '', category_id: null, quantity: 0, buying_price: 0, selling_price: 0, low_stock_threshold: 5 })
    setEditingProduct(null)
  }

  const filtered = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku?.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter
    return matchesSearch && matchesCategory
  }) || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ ...form, id: editingProduct })
        toast.success('Product updated!')
      } else {
        await addProduct.mutateAsync(form)
        toast.success('Product added!')
      }
      setDialogOpen(false)
      resetForm()
    } catch (err) {
      toast.error('Failed to save product')
    }
  }

  const handleEdit = (p: typeof products extends (infer T)[] | undefined ? T : never) => {
    setForm({
      name: p.name, sku: p.sku || '', category_id: p.category_id,
      quantity: p.quantity, buying_price: Number(p.buying_price),
      selling_price: Number(p.selling_price), low_stock_threshold: p.low_stock_threshold,
    })
    setEditingProduct(p.id)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('inventory.deleteConfirm'))) return
    try {
      await deleteProduct.mutateAsync(id)
      toast.success('Product deleted!')
    } catch { toast.error('Failed to delete') }
  }

  const getStockBadge = (qty: number, threshold: number) => {
    if (qty === 0) return <Badge variant="destructive" className="text-xs">{t('inventory.outOfStock')}</Badge>
    if (qty <= threshold) return <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0">{t('inventory.lowStock')}</Badge>
    return <Badge className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">{t('inventory.inStock')}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} products</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <Plus className="h-4 w-4 mr-2" />{t('inventory.addProduct')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? t('inventory.editProduct') : t('inventory.addProduct')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('inventory.productName')} *</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('inventory.sku')}</Label>
                  <Input value={form.sku || ''} onChange={e => setForm({...form, sku: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t('inventory.category')}</Label>
                  <Select value={form.category_id || 'none'} onValueChange={v => setForm({...form, category_id: v === 'none' ? null : v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('inventory.quantity')}</Label>
                  <Input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 0})} min={0} />
                </div>
                <div className="space-y-2">
                  <Label>{t('inventory.lowStockThreshold')}</Label>
                  <Input type="number" value={form.low_stock_threshold} onChange={e => setForm({...form, low_stock_threshold: parseInt(e.target.value) || 0})} min={0} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('inventory.buyingPrice')} (ETB)</Label>
                  <Input type="number" step="0.01" value={form.buying_price} onChange={e => setForm({...form, buying_price: parseFloat(e.target.value) || 0})} min={0} />
                </div>
                <div className="space-y-2">
                  <Label>{t('inventory.sellingPrice')} (ETB)</Label>
                  <Input type="number" step="0.01" value={form.selling_price} onChange={e => setForm({...form, selling_price: parseFloat(e.target.value) || 0})} min={0} />
                </div>
              </div>
              <Button type="submit" disabled={addProduct.isPending || updateProduct.isPending} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                {(addProduct.isPending || updateProduct.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('common.save')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('inventory.search')} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('inventory.allCategories')}</SelectItem>
            {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg">{t('inventory.noProducts')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('inventory.noProductsDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <Card key={p.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                    {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
                    {p.categories && <Badge variant="outline" className="text-xs mt-1">{p.categories.name}</Badge>}
                  </div>
                  {p.quantity <= p.low_stock_threshold && p.quantity > 0 && (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 ml-2" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div><span className="text-muted-foreground">Buy:</span> <span className="font-medium">{formatETB(p.buying_price)}</span></div>
                  <div><span className="text-muted-foreground">Sell:</span> <span className="font-medium">{formatETB(p.selling_price)}</span></div>
                  <div><span className="text-muted-foreground">Qty:</span> <span className="font-bold text-foreground">{p.quantity}</span></div>
                  <div>{getStockBadge(p.quantity, p.low_stock_threshold)}</div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleEdit(p)}>
                    <Edit className="h-3 w-3 mr-1" />{t('common.edit')}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
