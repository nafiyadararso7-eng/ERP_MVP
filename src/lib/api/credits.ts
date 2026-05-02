import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/auth'

export interface CreditEntry {
  id: string
  shop_id: string
  sale_id: string
  customer_id: string
  amount_owed: number
  amount_paid: number
  status: 'pending' | 'partial' | 'paid'
  created_at: string
  customers?: { name: string; phone: string | null } | null
  sales?: { total: number; created_at: string } | null
}

export interface Customer {
  id: string
  shop_id: string
  name: string
  phone: string | null
  email: string | null
  created_at: string
}

export function useCreditEntries(status?: string) {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['credits', shop?.id, status],
    queryFn: async () => {
      if (!shop) return []
      let query = supabase
        .from('credit_entries')
        .select('*, customers(name, phone), sales(total, created_at)')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      return data as CreditEntry[]
    },
    enabled: !!shop,
  })
}

export function useCustomerCredits(customerId: string) {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['credits', 'customer', customerId],
    queryFn: async () => {
      if (!shop) return []
      const { data, error } = await supabase
        .from('credit_entries')
        .select('*, sales(total, created_at)')
        .eq('shop_id', shop.id)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CreditEntry[]
    },
    enabled: !!shop && !!customerId,
  })
}

export function useCustomers() {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['customers', shop?.id],
    queryFn: async () => {
      if (!shop) return []
      const { data, error } = await supabase
        .from('customers').select('*').eq('shop_id', shop.id).order('name')
      if (error) throw error
      return data as Customer[]
    },
    enabled: !!shop,
  })
}

export function useAddCustomer() {
  const { shop } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone?: string }) => {
      if (!shop) throw new Error('No shop')
      const { data, error } = await supabase
        .from('customers')
        .insert({ name, phone: phone || null, shop_id: shop.id })
        .select().single()
      if (error) throw error
      return data as Customer
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }) },
  })
}

export function useRecordPayment() {
  const { shop } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ creditEntryId, amount }: { creditEntryId: string; amount: number }) => {
      if (!shop) throw new Error('No shop')
      const { data, error } = await supabase
        .from('payments')
        .insert({ shop_id: shop.id, credit_entry_id: creditEntryId, amount, date: new Date().toISOString().split('T')[0] })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useOutstandingTotal() {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['credits', 'outstanding-total', shop?.id],
    queryFn: async () => {
      if (!shop) return 0
      const { data, error } = await supabase
        .from('credit_entries').select('amount_owed, amount_paid')
        .eq('shop_id', shop.id).in('status', ['pending', 'partial'])
      if (error) throw error
      return data.reduce((s, c) => s + (Number(c.amount_owed) - Number(c.amount_paid)), 0)
    },
    enabled: !!shop,
  })
}
