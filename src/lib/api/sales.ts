import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/auth'

// ============================================
// Types
// ============================================
export interface Sale {
  id: string
  shop_id: string
  cashier_id: string
  customer_id: string | null
  payment_type: 'cash' | 'credit'
  total: number
  created_at: string
  customers?: { name: string; phone: string | null } | null
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  products?: { name: string } | null
}

export interface SaleWithItems extends Sale {
  sale_items: SaleItem[]
}

export interface CartItem {
  product_id: string
  name: string
  quantity: number
  unit_price: number
  available_stock: number
}

export interface CompleteSaleInput {
  items: CartItem[]
  payment_type: 'cash' | 'credit'
  customer_id?: string | null
  total: number
}

// ============================================
// Hooks
// ============================================
export function useSales(dateFilter?: string) {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['sales', shop?.id, dateFilter],
    queryFn: async () => {
      if (!shop) return []
      let query = supabase
        .from('sales')
        .select('*, customers(name, phone)')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })

      if (dateFilter) {
        query = query.gte('created_at', `${dateFilter}T00:00:00`)
          .lte('created_at', `${dateFilter}T23:59:59`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Sale[]
    },
    enabled: !!shop,
  })
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .select('*, customers(name, phone)')
        .eq('id', id)
        .single()
      if (saleErr) throw saleErr

      const { data: items, error: itemsErr } = await supabase
        .from('sale_items')
        .select('*, products(name)')
        .eq('sale_id', id)
      if (itemsErr) throw itemsErr

      return { ...sale, sale_items: items } as SaleWithItems
    },
    enabled: !!id,
  })
}

export function useCompleteSale() {
  const { shop, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CompleteSaleInput) => {
      if (!shop || !user) throw new Error('Not authenticated')

      // Create sale
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert({
          shop_id: shop.id,
          cashier_id: user.id,
          customer_id: input.customer_id || null,
          payment_type: input.payment_type,
          total: input.total,
        })
        .select()
        .single()
      if (saleErr) throw saleErr

      // Create sale items (stock decrement handled by DB trigger)
      const saleItems = input.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
      }))

      const { error: itemsErr } = await supabase
        .from('sale_items')
        .insert(saleItems)
      if (itemsErr) throw itemsErr

      // If credit sale, create credit entry
      if (input.payment_type === 'credit' && input.customer_id) {
        const { error: creditErr } = await supabase
          .from('credit_entries')
          .insert({
            shop_id: shop.id,
            sale_id: sale.id,
            customer_id: input.customer_id,
            amount_owed: input.total,
          })
        if (creditErr) throw creditErr
      }

      return sale
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useTodaySalesTotal() {
  const { shop } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: ['sales', 'today-total', shop?.id, today],
    queryFn: async () => {
      if (!shop) return 0
      const { data, error } = await supabase
        .from('sales')
        .select('total')
        .eq('shop_id', shop.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
      if (error) throw error
      return data.reduce((sum, s) => sum + Number(s.total), 0)
    },
    enabled: !!shop,
  })
}
