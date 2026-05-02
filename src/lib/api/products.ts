import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/auth'

// ============================================
// Types
// ============================================
export interface Product {
  id: string
  shop_id: string
  name: string
  sku: string | null
  category_id: string | null
  quantity: number
  buying_price: number
  selling_price: number
  low_stock_threshold: number
  created_at: string
  updated_at: string
  categories?: { name: string } | null
}

export interface ProductInput {
  name: string
  sku?: string
  category_id?: string | null
  quantity: number
  buying_price: number
  selling_price: number
  low_stock_threshold: number
}

// ============================================
// Hooks
// ============================================
export function useProducts() {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['products', shop?.id],
    queryFn: async () => {
      if (!shop) return []
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Product[]
    },
    enabled: !!shop,
  })
}

export function useProduct(id: string) {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Product
    },
    enabled: !!shop && !!id,
  })
}

export function useAddProduct() {
  const { shop } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ProductInput) => {
      if (!shop) throw new Error('No shop')
      const { data, error } = await supabase
        .from('products')
        .insert({ ...input, shop_id: shop.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: ProductInput & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useRestockProduct() {
  const { shop } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
      totalCost,
      expenseCategoryId,
    }: {
      productId: string
      quantity: number
      totalCost: number
      expenseCategoryId?: string
    }) => {
      if (!shop) throw new Error('No shop')

      // Increment stock
      const { data: product, error: fetchErr } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', productId)
        .single()
      if (fetchErr) throw fetchErr

      const { error: updateErr } = await supabase
        .from('products')
        .update({ quantity: product.quantity + quantity })
        .eq('id', productId)
      if (updateErr) throw updateErr

      // Create expense entry for the restock
      const { error: expenseErr } = await supabase.from('expenses').insert({
        shop_id: shop.id,
        amount: totalCost,
        category_id: expenseCategoryId || null,
        note: `Restock: +${quantity} units`,
        date: new Date().toISOString().split('T')[0],
      })
      if (expenseErr) throw expenseErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
