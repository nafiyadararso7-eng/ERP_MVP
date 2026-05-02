import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useT } from '#/lib/i18n'
import { useCreditEntries, useRecordPayment } from '#/lib/api/credits'
import { formatETB, formatDate } from '#/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { CreditCard, Loader2, Banknote } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/credits')({
  component: CreditsPage,
})

function CreditsPage() {
  const { t } = useT()
  const { data: credits, isLoading } = useCreditEntries()
  const recordPayment = useRecordPayment()

  const [payDialog, setPayDialog] = useState<{ id: string; balance: number } | null>(null)
  const [payAmount, setPayAmount] = useState(0)

  const totalOwed = credits?.reduce((s, c) => s + (Number(c.amount_owed) - Number(c.amount_paid)), 0) || 0

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payDialog) return
    try {
      await recordPayment.mutateAsync({ creditEntryId: payDialog.id, amount: payAmount })
      toast.success('Payment recorded!')
      setPayDialog(null)
      setPayAmount(0)
    } catch { toast.error(t('common.error')) }
  }

  const statusColor = (s: string) => {
    if (s === 'paid') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (s === 'partial') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('credits.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('credits.totalOwed')}: <span className="font-bold text-red-500">{formatETB(totalOwed)}</span></p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : !credits?.length ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center py-16">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold">{t('credits.noCredits')}</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {credits.map(c => {
            const balance = Number(c.amount_owed) - Number(c.amount_paid)
            return (
              <Card key={c.id} className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{c.customers?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
                    <div className="flex gap-2 items-center">
                      <Badge className={`text-xs border-0 ${statusColor(c.status)}`}>
                        {c.status === 'paid' ? t('credits.paid') : c.status === 'partial' ? t('credits.partial') : t('credits.outstanding')}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs text-muted-foreground">{t('credits.totalOwed')}: {formatETB(c.amount_owed)}</p>
                    <p className="text-xs text-muted-foreground">{t('credits.totalPaid')}: {formatETB(c.amount_paid)}</p>
                    <p className="font-bold text-red-500">{t('credits.balance')}: {formatETB(balance)}</p>
                    {c.status !== 'paid' && (
                      <Button size="sm" variant="outline" onClick={() => { setPayDialog({ id: c.id, balance }); setPayAmount(balance) }}>
                        <Banknote className="h-3 w-3 mr-1" />{t('credits.recordPayment')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!payDialog} onOpenChange={open => { if (!open) setPayDialog(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('credits.recordPayment')}</DialogTitle></DialogHeader>
          <form onSubmit={handlePay} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('credits.paymentAmount')} (ETB)</Label>
              <Input type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                max={payDialog?.balance} min={0.01} required />
            </div>
            <Button type="submit" disabled={recordPayment.isPending} className="w-full bg-emerald-600 text-white">
              {recordPayment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{t('common.save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
