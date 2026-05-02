import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/auth'

export interface Category {
  id: string
  shop_id: string
  name: string
  type: 'product' | 'expense'
  created_at: string
}

export function useCategories(type?: 'product' | 'expense') {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['categories', shop?.id, type],
    queryFn: async () => {
      if (!shop) return []
      let query = supabase.from('categories').select('*').eq('shop_id', shop.id).order('name')
      if (type) query = query.eq('type', type)
      const { data, error } = await query
      if (error) throw error
      return data as Category[]
    },
    enabled: !!shop,
  })
}

export function useAddCategory() {
  const { shop } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, type }: { name: string; type: 'product' | 'expense' }) => {
      if (!shop) throw new Error('No shop')
      const { data, error } = await supabase
        .from('categories').insert({ name, type, shop_id: shop.id }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }) },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }) },
  })
}
