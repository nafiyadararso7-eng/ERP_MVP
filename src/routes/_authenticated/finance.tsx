import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useT } from '#/lib/i18n'
import { useExpenses, useAddExpense, useDeleteExpense, useFinanceSummary } from '#/lib/api/expenses'
import { useCategories } from '#/lib/api/categories'
import { formatETB, formatDate, exportToCSV } from '#/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Plus, Download, Trash2, Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/finance')({
  component: FinancePage,
})

function FinancePage() {
  const { t } = useT()
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: expenses, isLoading } = useExpenses()
  const { data: categories } = useCategories('expense')
  const { data: summary } = useFinanceSummary(period)
  const addExpense = useAddExpense()
  const deleteExpense = useDeleteExpense()

  const [form, setForm] = useState({ amount: 0, category_id: '', date: new Date().toISOString().split('T')[0], note: '', supplier_id: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addExpense.mutateAsync({
        amount: form.amount,
        category_id: form.category_id || null,
        date: form.date,
        note: form.note || undefined,
      })
      toast.success('Expense added!')
      setDialogOpen(false)
      setForm({ amount: 0, category_id: '', date: new Date().toISOString().split('T')[0], note: '', supplier_id: '' })
    } catch { toast.error(t('common.error')) }
  }

  const handleExport = () => {
    if (!expenses?.length) return
    exportToCSV(expenses.map(e => ({
      Date: e.date,
      Amount: e.amount,
      Category: e.categories?.name || '',
      Note: e.note || '',
    })), 'expenses')
    toast.success('CSV exported!')
  }

  const summaryCards = [
    { label: t('finance.revenue'), value: formatETB(summary?.revenue || 0), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: t('finance.expenses'), value: formatETB(summary?.expenses || 0), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: t('finance.grossProfit'), value: formatETB(summary?.grossProfit || 0), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('finance.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />{t('finance.exportCsv')}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <Plus className="h-4 w-4 mr-2" />{t('finance.addExpense')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('finance.addExpense')}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('finance.amount')} (ETB) *</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})} required min={0.01} />
                </div>
                <div className="space-y-2">
                  <Label>{t('finance.expenseCategory')}</Label>
                  <Select value={form.category_id} onValueChange={v => setForm({...form, category_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('finance.date')}</Label>
                  <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t('finance.note')}</Label>
                  <Textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} rows={2} />
                </div>
                <Button type="submit" disabled={addExpense.isPending} className="w-full bg-emerald-600 text-white">
                  {addExpense.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{t('common.save')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Period Toggle */}
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly'] as const).map(p => (
          <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm"
            onClick={() => setPeriod(p)} className={period === p ? 'bg-emerald-600' : ''}>
            {t(`finance.${p}`)}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${s.bg}`}><Icon className={`h-5 w-5 ${s.color}`} /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Expense List */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">{t('finance.expenses')}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
          ) : !expenses?.length ? (
            <p className="text-center text-muted-foreground py-8">{t('finance.noExpenses')}</p>
          ) : (
            <div className="space-y-2">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{e.note || e.categories?.name || 'Expense'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(e.date)}{e.categories ? ` · ${e.categories.name}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-red-500">-{formatETB(e.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                      onClick={async () => { await deleteExpense.mutateAsync(e.id); toast.success('Deleted') }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
