import { useQuery } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/auth'

export function useDashboardStats() {
  const { shop } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: ['dashboard', 'stats', shop?.id, today],
    queryFn: async () => {
      if (!shop) return { todaySales: 0, todayExpenses: 0, todayProfit: 0, lowStockCount: 0, outstandingDebts: 0 }

      const [salesRes, expensesRes, lowStockRes, debtsRes] = await Promise.all([
        supabase.from('sales').select('total').eq('shop_id', shop.id)
          .gte('created_at', `${today}T00:00:00`).lte('created_at', `${today}T23:59:59`),
        supabase.from('expenses').select('amount').eq('shop_id', shop.id).eq('date', today),
        supabase.from('products').select('id').eq('shop_id', shop.id).lte('quantity', 5),
        supabase.from('credit_entries').select('amount_owed, amount_paid')
          .eq('shop_id', shop.id).in('status', ['pending', 'partial']),
      ])

      const todaySales = salesRes.data?.reduce((s, r) => s + Number(r.total), 0) || 0
      const todayExpenses = expensesRes.data?.reduce((s, r) => s + Number(r.amount), 0) || 0

      return {
        todaySales,
        todayExpenses,
        todayProfit: todaySales - todayExpenses,
        lowStockCount: lowStockRes.data?.length || 0,
        outstandingDebts: debtsRes.data?.reduce((s, c) => s + (Number(c.amount_owed) - Number(c.amount_paid)), 0) || 0,
      }
    },
    enabled: !!shop,
    refetchInterval: 30000,
  })
}

export function useSalesChart() {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['dashboard', 'sales-chart', shop?.id],
    queryFn: async () => {
      if (!shop) return []
      const days: { date: string; total: number; label: string }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const { data } = await supabase.from('sales').select('total').eq('shop_id', shop.id)
          .gte('created_at', `${dateStr}T00:00:00`).lte('created_at', `${dateStr}T23:59:59`)
        days.push({
          date: dateStr,
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          total: data?.reduce((s, r) => s + Number(r.total), 0) || 0,
        })
      }
      return days
    },
    enabled: !!shop,
  })
}

export function useTopProducts() {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['dashboard', 'top-products', shop?.id],
    queryFn: async () => {
      if (!shop) return []
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { data: sales } = await supabase.from('sales').select('id')
        .eq('shop_id', shop.id).gte('created_at', weekAgo.toISOString())
      if (!sales?.length) return []

      const saleIds = sales.map(s => s.id)
      const { data: items } = await supabase.from('sale_items')
        .select('product_id, quantity, products(name)').in('sale_id', saleIds)
      if (!items) return []

      const productMap = new Map<string, { name: string; totalQty: number }>()
      for (const item of items) {
        const existing = productMap.get(item.product_id)
        const name = (item.products as unknown as { name: string })?.name || 'Unknown'
        if (existing) {
          existing.totalQty += item.quantity
        } else {
          productMap.set(item.product_id, { name, totalQty: item.quantity })
        }
      }

      return Array.from(productMap.values())
        .sort((a, b) => b.totalQty - a.totalQty)
        .slice(0, 5)
    },
    enabled: !!shop,
  })
}

export function useRecentActivity() {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['dashboard', 'recent-activity', shop?.id],
    queryFn: async () => {
      if (!shop) return []
      const [salesRes, expensesRes, paymentsRes] = await Promise.all([
        supabase.from('sales').select('id, total, payment_type, created_at')
          .eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('expenses').select('id, amount, note, created_at')
          .eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('payments').select('id, amount, created_at')
          .eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(5),
      ])

      type Activity = { id: string; type: string; description: string; amount: number; created_at: string }
      const activities: Activity[] = []

      salesRes.data?.forEach(s => activities.push({
        id: s.id, type: 'sale', description: `${s.payment_type} sale`, amount: Number(s.total), created_at: s.created_at,
      }))
      expensesRes.data?.forEach(e => activities.push({
        id: e.id, type: 'expense', description: e.note || 'Expense', amount: Number(e.amount), created_at: e.created_at,
      }))
      paymentsRes.data?.forEach(p => activities.push({
        id: p.id, type: 'payment', description: 'Debt payment', amount: Number(p.amount), created_at: p.created_at,
      }))

      return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10)
    },
    enabled: !!shop,
  })
}
