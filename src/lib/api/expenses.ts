import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/auth'

// ============================================
// Types
// ============================================
export interface Expense {
  id: string
  shop_id: string
  amount: number
  category_id: string | null
  date: string
  note: string | null
  supplier_id: string | null
  created_at: string
  categories?: { name: string } | null
  suppliers?: { name: string } | null
}

export interface ExpenseInput {
  amount: number
  category_id?: string | null
  date: string
  note?: string
  supplier_id?: string | null
}

export interface FinanceSummary {
  revenue: number
  expenses: number
  grossProfit: number
}

// ============================================
// Hooks
// ============================================
export function useExpenses(dateRange?: { from: string; to: string }) {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['expenses', shop?.id, dateRange],
    queryFn: async () => {
      if (!shop) return []
      let query = supabase
        .from('expenses')
        .select('*, categories(name), suppliers(name)')
        .eq('shop_id', shop.id)
        .order('date', { ascending: false })

      if (dateRange) {
        query = query.gte('date', dateRange.from).lte('date', dateRange.to)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Expense[]
    },
    enabled: !!shop,
  })
}

export function useAddExpense() {
  const { shop } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ExpenseInput) => {
      if (!shop) throw new Error('No shop')
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...input, shop_id: shop.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useFinanceSummary(period: 'daily' | 'weekly' | 'monthly') {
  const { shop } = useAuth()

  return useQuery({
    queryKey: ['finance-summary', shop?.id, period],
    queryFn: async (): Promise<FinanceSummary> => {
      if (!shop) return { revenue: 0, expenses: 0, grossProfit: 0 }

      const now = new Date()
      let fromDate: string

      if (period === 'daily') {
        fromDate = now.toISOString().split('T')[0]
      } else if (period === 'weekly') {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        fromDate = weekAgo.toISOString().split('T')[0]
      } else {
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        fromDate = monthAgo.toISOString().split('T')[0]
      }

      const toDate = now.toISOString().split('T')[0]

      // Get revenue
      const { data: sales } = await supabase
        .from('sales')
        .select('total')
        .eq('shop_id', shop.id)
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`)

      const revenue = sales?.reduce((sum, s) => sum + Number(s.total), 0) || 0

      // Get expenses
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('shop_id', shop.id)
        .gte('date', fromDate)
        .lte('date', toDate)

      const expenses = expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

      return {
        revenue,
        expenses,
        grossProfit: revenue - expenses,
      }
    },
    enabled: !!shop,
  })
}

export function useTodayExpensesTotal() {
  const { shop } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: ['expenses', 'today-total', shop?.id, today],
    queryFn: async () => {
      if (!shop) return 0
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('shop_id', shop.id)
        .eq('date', today)
      if (error) throw error
      return data.reduce((sum, e) => sum + Number(e.amount), 0)
    },
    enabled: !!shop,
  })
}
