import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useT } from '#/lib/i18n'
import { useProducts } from '#/lib/api/products'
import { useCompleteSale, type CartItem } from '#/lib/api/sales'
import { useCustomers, useAddCustomer } from '#/lib/api/credits'
import { formatETB } from '#/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Loader2, CheckCircle2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/pos')({
  component: POSPage,
})

function POSPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const { data: products } = useProducts()
  const { data: customers } = useCustomers()
  const completeSale = useCompleteSale()
  const addCustomer = useAddCustomer()

  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash')
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')

  const filteredProducts = useMemo(() =>
    products?.filter(p => p.quantity > 0 && p.name.toLowerCase().includes(search.toLowerCase())) || [],
    [products, search]
  )

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [cart])

  const addToCart = (product: NonNullable<typeof products>[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error('Not enough stock')
          return prev
        }
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product_id: product.id, name: product.name, quantity: 1, unit_price: Number(product.selling_price), available_stock: product.quantity }]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== productId) return i
      const newQty = i.quantity + delta
      if (newQty <= 0) return i
      if (newQty > i.available_stock) { toast.error('Not enough stock'); return i }
      return { ...i, quantity: newQty }
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product_id !== productId))
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0) return
    if (paymentType === 'credit' && !customerId) {
      toast.error(t('pos.selectCustomer'))
      return
    }
    try {
      const sale = await completeSale.mutateAsync({ items: cart, payment_type: paymentType, customer_id: customerId, total })
      toast.success(t('pos.saleComplete'))
      setCart([])
      setCustomerId(null)
      setPaymentType('cash')
      navigate({ to: '/sales/$id', params: { id: sale.id } })
    } catch { toast.error(t('common.error')) }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const customer = await addCustomer.mutateAsync({ name: newCustomerName, phone: newCustomerPhone })
      setCustomerId(customer.id)
      setShowCustomerDialog(false)
      setNewCustomerName('')
      setNewCustomerPhone('')
      toast.success('Customer added!')
    } catch { toast.error(t('common.error')) }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* Product Grid */}
      <div className="flex-1 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{t('pos.title')}</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('pos.searchProducts')} className="pl-9 h-12 text-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map(p => (
            <button key={p.id} onClick={() => addToCart(p)}
              className="text-left p-4 rounded-xl border border-border bg-card hover:border-emerald-300 hover:shadow-md transition-all duration-200 active:scale-95 group">
              <h4 className="font-semibold text-sm truncate group-hover:text-emerald-600">{p.name}</h4>
              <p className="text-lg font-bold text-emerald-600 mt-1">{formatETB(p.selling_price)}</p>
              <p className="text-xs text-muted-foreground mt-1">Stock: {p.quantity}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <Card className="lg:w-[380px] border-0 shadow-xl flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />{t('pos.cart')}
            {cart.length > 0 && <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">{cart.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">{t('pos.emptyCart')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('pos.emptyCartDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatETB(item.unit_price)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product_id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product_id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-semibold w-20 text-right">{formatETB(item.quantity * item.unit_price)}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product_id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Cart footer */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Payment type */}
            <div className="flex gap-2">
              <Button variant={paymentType === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentType('cash')} className={`flex-1 ${paymentType === 'cash' ? 'bg-emerald-600' : ''}`}>
                <Banknote className="h-4 w-4 mr-2" />{t('pos.cash')}
              </Button>
              <Button variant={paymentType === 'credit' ? 'default' : 'outline'} onClick={() => setPaymentType('credit')} className={`flex-1 ${paymentType === 'credit' ? 'bg-amber-600' : ''}`}>
                <CreditCard className="h-4 w-4 mr-2" />{t('pos.credit')}
              </Button>
            </div>

            {paymentType === 'credit' && (
              <div className="space-y-2">
                <Label>{t('pos.selectCustomer')}</Label>
                <div className="flex gap-2">
                  <Select value={customerId || ''} onValueChange={v => setCustomerId(v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder={t('pos.selectCustomer')} /></SelectTrigger>
                    <SelectContent>
                      {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => setShowCustomerDialog(true)}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-lg font-bold">
              <span>{t('pos.total')}</span>
              <span className="text-emerald-600">{formatETB(total)}</span>
            </div>
            <Button onClick={handleCompleteSale} disabled={completeSale.isPending}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-base font-semibold shadow-lg shadow-emerald-500/25">
              {completeSale.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
              {t('pos.completeSale')}
            </Button>
          </div>
        )}
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('pos.addCustomer')}</DialogTitle></DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('pos.customerName')} *</Label>
              <Input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t('pos.customerPhone')}</Label>
              <Input value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
            </div>
            <Button type="submit" disabled={addCustomer.isPending} className="w-full bg-emerald-600 text-white">
              {addCustomer.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{t('common.save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
