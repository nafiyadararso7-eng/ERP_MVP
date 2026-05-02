import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/lib/auth'

export interface Invitation {
  id: string
  shop_id: string
  email: string
  token: string
  invited_by: string
  accepted: boolean
  created_at: string
  expires_at: string
}

export interface InvitationDetails {
  valid: boolean
  email?: string
  shop_name?: string
  shop_id?: string
  error?: string
}

// ─── Check if any owner exists (for signup page) ───
export function useOwnerExists() {
  return useQuery({
    queryKey: ['owner-exists'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('owner_exists')
      if (error) throw error
      return data as boolean
    },
    staleTime: 30 * 1000,
  })
}

// ─── Validate invitation token (for join page) ───
export function useInvitationByToken(token: string | null) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      if (!token) throw new Error('No token')
      const { data, error } = await supabase.rpc('get_invitation_by_token', {
        _token: token,
      })
      if (error) throw error
      return data as InvitationDetails
    },
    enabled: !!token,
    retry: false,
  })
}

// ─── Create invitation (owner action) ───
export function useCreateInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.rpc('create_invitation', {
        _email: email,
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data as { success: boolean; token: string; existing: boolean }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations'] })
    },
  })
}

// ─── Accept invitation (cashier action after signup) ───
export async function acceptInvitation(token: string) {
  const { data, error } = await supabase.rpc('accept_invitation', {
    _token: token,
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data as { success: boolean; shop_id: string }
}

// ─── List invitations for the shop (owner view) ───
export function useShopInvitations() {
  const { shop } = useAuth()
  return useQuery({
    queryKey: ['invitations', shop?.id],
    queryFn: async () => {
      if (!shop) return []
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Invitation[]
    },
    enabled: !!shop,
  })
}

// ─── Delete/revoke invitation ───
export function useDeleteInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invitations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations'] })
    },
  })
}
