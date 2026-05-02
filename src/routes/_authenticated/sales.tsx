import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useT } from '#/lib/i18n'
import { useSales } from '#/lib/api/sales'
import { formatETB, formatDateTime } from '#/lib/format'
import { Card, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Receipt, Eye, Loader2 } from 'lucide-react'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/_authenticated/sales')({
  component: SalesPage,
})

function SalesPage() {
  const { t } = useT()
  const [dateFilter, setDateFilter] = useState('')
  const { data: sales, isLoading } = useSales(dateFilter || undefined)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('sales.title')}</h1>
          <p className="text-sm text-muted-foreground">{sales?.length || 0} sales</p>
        </div>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full sm:w-auto" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : !sales?.length ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center py-16">
            <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold">{t('sales.noSales')}</h3>
            <p className="text-sm text-muted-foreground">{t('sales.noSalesDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sales.map(s => (
            <Card key={s.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${s.payment_type === 'cash' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                    <Receipt className={`h-4 w-4 ${s.payment_type === 'cash' ? 'text-emerald-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{formatDateTime(s.created_at)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={s.payment_type === 'cash' ? 'default' : 'secondary'} className="text-xs">
                        {s.payment_type === 'cash' ? t('pos.cash') : t('pos.credit')}
                      </Badge>
                      {s.customers && <span className="text-xs text-muted-foreground">{s.customers.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-emerald-600">{formatETB(s.total)}</span>
                  <Link to="/sales/$id" params={{ id: s.id }}>
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
