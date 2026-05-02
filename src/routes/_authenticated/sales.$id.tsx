import { createFileRoute } from '@tanstack/react-router'
import { useT } from '#/lib/i18n'
import { useAuth } from '#/lib/auth'
import { useSale } from '#/lib/api/sales'
import { formatETB, formatDateTime } from '#/lib/format'
import { Card, CardContent } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Separator } from '#/components/ui/separator'
import { Printer, Share2, Loader2, ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/sales/$id')({
  component: ReceiptPage,
})

function ReceiptPage() {
  const { id } = Route.useParams()
  const { t } = useT()
  const { shop } = useAuth()
  const { data: sale, isLoading } = useSale(id)

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
  if (!sale) return <p>Sale not found</p>

  const handlePrint = () => window.print()
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied!')
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Link to="/sales"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back to Sales</Button></Link>

      <Card className="border-0 shadow-xl print:shadow-none" id="receipt">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-xl font-bold">{shop?.name}</h2>
            {shop?.address && <p className="text-xs text-muted-foreground">{shop.address}</p>}
            {shop?.phone && <p className="text-xs text-muted-foreground">{shop.phone}</p>}
            <Separator className="my-3" />
            <p className="text-sm font-medium">{t('sales.receipt')}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(sale.created_at)}</p>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-2">
            <div className="flex text-xs font-semibold text-muted-foreground">
              <span className="flex-1">{t('sales.items')}</span>
              <span className="w-12 text-center">Qty</span>
              <span className="w-20 text-right">{t('common.price')}</span>
              <span className="w-24 text-right">{t('common.total')}</span>
            </div>
            {sale.sale_items.map(item => (
              <div key={item.id} className="flex text-sm">
                <span className="flex-1">{(item.products as unknown as { name: string })?.name || '—'}</span>
                <span className="w-12 text-center">{item.quantity}</span>
                <span className="w-20 text-right">{formatETB(item.unit_price)}</span>
                <span className="w-24 text-right font-medium">{formatETB(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between text-lg font-bold">
            <span>{t('pos.total')}</span>
            <span className="text-emerald-600">{formatETB(sale.total)}</span>
          </div>

          <div className="flex gap-2 text-xs">
            <Badge variant={sale.payment_type === 'cash' ? 'default' : 'secondary'}>
              {sale.payment_type === 'cash' ? t('pos.cash') : t('pos.credit')}
            </Badge>
            {sale.customers && <span className="text-muted-foreground">Customer: {sale.customers.name}</span>}
          </div>

          <Separator />
          <p className="text-center text-xs text-muted-foreground">Thank you for your purchase!</p>
        </CardContent>
      </Card>

      <div className="flex gap-3 print:hidden">
        <Button onClick={handlePrint} className="flex-1 bg-emerald-600 text-white">
          <Printer className="h-4 w-4 mr-2" />{t('sales.print')}
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex-1">
          <Share2 className="h-4 w-4 mr-2" />{t('sales.share')}
        </Button>
      </div>
    </div>
  )
}
