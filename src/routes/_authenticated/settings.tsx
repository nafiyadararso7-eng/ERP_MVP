import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useT } from '#/lib/i18n'
import { useAuth } from '#/lib/auth'
import { useTheme } from '#/lib/theme'
import { useCategories, useAddCategory, useDeleteCategory } from '#/lib/api/categories'
import { useCreateInvitation, useShopInvitations, useDeleteInvitation } from '#/lib/api/invitations'
import { supabase } from '#/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import { Badge } from '#/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Store, Globe, UserPlus, Tag, Loader2, Trash2, Plus, Sun, Moon, Monitor, Copy, Check, Link as LinkIcon, Clock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { t } = useT()
  const { language, setLanguage } = useT()
  const { shop, refreshUserData } = useAuth()
  const { theme, setTheme } = useTheme()
  const { data: productCats } = useCategories('product')
  const { data: expenseCats } = useCategories('expense')
  const addCategory = useAddCategory()
  const deleteCategory = useDeleteCategory()

  const [shopName, setShopName] = useState(shop?.name || '')
  const [shopAddress, setShopAddress] = useState(shop?.address || '')
  const [shopPhone, setShopPhone] = useState(shop?.phone || '')
  const [saving, setSaving] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const createInvitation = useCreateInvitation()
  const { data: invitations, isLoading: loadingInvitations } = useShopInvitations()
  const deleteInvitation = useDeleteInvitation()
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null)

  const [newCatName, setNewCatName] = useState('')
  const [newCatType, setNewCatType] = useState<'product' | 'expense'>('product')

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop) return
    setSaving(true)
    const { error } = await supabase.from('shops').update({
      name: shopName, address: shopAddress || null, phone: shopPhone || null,
    }).eq('id', shop.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    await refreshUserData()
    toast.success(t('settings.saved'))
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      const result = await createInvitation.mutateAsync(inviteEmail.trim())
      const link = `${window.location.origin}/join?token=${result.token}`
      setLastInviteLink(link)

      if (result.existing) {
        toast.info(t('settings.inviteExisting'))
      } else {
        toast.success(t('settings.inviteSent'))
      }
      setInviteEmail('')
    } catch (err: any) {
      toast.error(err.message || t('common.error'))
    }
  }

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/join?token=${token}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedToken(token)
      toast.success(t('settings.linkCopied'))
      setTimeout(() => setCopiedToken(null), 2000)
    } catch {
      // Fallback for non-HTTPS
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedToken(token)
      toast.success(t('settings.linkCopied'))
      setTimeout(() => setCopiedToken(null), 2000)
    }
  }

  const handleRevokeInvitation = async (id: string) => {
    try {
      await deleteInvitation.mutateAsync(id)
      toast.success(t('settings.inviteRevoked'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      await addCategory.mutateAsync({ name: newCatName, type: newCatType })
      setNewCatName('')
      toast.success('Category added!')
    } catch { toast.error(t('common.error')) }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id)
      toast.success('Category deleted!')
    } catch { toast.error(t('common.error')) }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <Tabs defaultValue="shop" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="shop"><Store className="h-4 w-4 mr-1.5 hidden sm:inline" />{t('settings.shopProfile')}</TabsTrigger>
          <TabsTrigger value="appearance"><Sun className="h-4 w-4 mr-1.5 hidden sm:inline" />{t('settings.theme')}</TabsTrigger>
          <TabsTrigger value="team"><UserPlus className="h-4 w-4 mr-1.5 hidden sm:inline" />{t('settings.inviteCashier')}</TabsTrigger>
          <TabsTrigger value="categories"><Tag className="h-4 w-4 mr-1.5 hidden sm:inline" />{t('settings.categories')}</TabsTrigger>
        </TabsList>

        {/* Shop Profile */}
        <TabsContent value="shop">
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-base">{t('settings.shopProfile')}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSaveShop} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('setup.shopName')}</Label>
                  <Input value={shopName} onChange={e => setShopName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('setup.address')}</Label>
                  <Input value={shopAddress} onChange={e => setShopAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('setup.phone')}</Label>
                  <Input value={shopPhone} onChange={e => setShopPhone(e.target.value)} />
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  💰 Currency: <strong>ETB (Ethiopian Birr)</strong> — locked
                </div>
                <Button type="submit" disabled={saving} className="bg-emerald-600 text-white">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{t('common.save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-base">{t('settings.theme')} & {t('settings.language')}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>{t('settings.theme')}</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'light' as const, icon: Sun, label: t('settings.light') },
                    { value: 'dark' as const, icon: Moon, label: t('settings.dark') },
                    { value: 'system' as const, icon: Monitor, label: t('settings.system') },
                  ].map(opt => (
                    <Button key={opt.value} variant={theme === opt.value ? 'default' : 'outline'}
                      className={`flex-1 ${theme === opt.value ? 'bg-emerald-600' : ''}`}
                      onClick={() => setTheme(opt.value)}>
                      <opt.icon className="h-4 w-4 mr-2" />{opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label>{t('settings.language')}</Label>
                <div className="flex gap-2">
                  <Button variant={language === 'en' ? 'default' : 'outline'}
                    className={`flex-1 ${language === 'en' ? 'bg-emerald-600' : ''}`}
                    onClick={() => setLanguage('en')}>
                    <Globe className="h-4 w-4 mr-2" />English
                  </Button>
                  <Button variant={language === 'am' ? 'default' : 'outline'}
                    className={`flex-1 ${language === 'am' ? 'bg-emerald-600' : ''}`}
                    onClick={() => setLanguage('am')}>
                    <Globe className="h-4 w-4 mr-2" />አማርኛ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invite Cashier */}
        <TabsContent value="team">
          <div className="space-y-4">
            {/* Invite Form */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-base">{t('settings.inviteCashier')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('auth.email')}</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="cashier@example.com"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={createInvitation.isPending} className="bg-emerald-600 text-white">
                    {createInvitation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <UserPlus className="h-4 w-4 mr-2" />{t('settings.inviteCashier')}
                  </Button>
                </form>

                {/* Show generated invite link */}
                {lastInviteLink && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      <LinkIcon className="h-4 w-4" />
                      {t('settings.inviteLinkReady')}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={lastInviteLink}
                        readOnly
                        className="text-xs bg-white dark:bg-gray-900 font-mono"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(lastInviteLink)
                          toast.success(t('settings.linkCopied'))
                        }}
                        className="bg-emerald-600 text-white flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {t('settings.shareInstructions')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending & Accepted Invitations */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-base">{t('settings.invitations')}</CardTitle></CardHeader>
              <CardContent>
                {loadingInvitations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !invitations?.length ? (
                  <div className="text-center py-8">
                    <UserPlus className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">{t('settings.noInvitations')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invitations.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                            inv.accepted
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                          }`}>
                            {inv.accepted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{inv.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {inv.accepted ? t('settings.inviteAccepted') : t('settings.invitePending')}
                              {' · '}
                              {new Date(inv.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!inv.accepted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(inv.token)}
                              className="h-8 w-8 p-0"
                              title={t('settings.copyLink')}
                            >
                              {copiedToken === inv.token
                                ? <Check className="h-4 w-4 text-emerald-600" />
                                : <Copy className="h-4 w-4" />
                              }
                            </Button>
                          )}
                          {!inv.accepted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvitation(inv.id)}
                              className="h-8 w-8 p-0 hover:text-destructive"
                              title={t('settings.revokeInvite')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories">
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-base">{t('settings.categories')}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder={t('settings.categoryName')} className="flex-1" />
                <select value={newCatType} onChange={e => setNewCatType(e.target.value as 'product' | 'expense')}
                  className="px-3 rounded-md border border-input bg-background text-sm">
                  <option value="product">Product</option>
                  <option value="expense">Expense</option>
                </select>
                <Button type="submit" disabled={addCategory.isPending} className="bg-emerald-600 text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>

              <div>
                <h4 className="text-sm font-semibold mb-2">{t('settings.productCategories')}</h4>
                <div className="flex flex-wrap gap-2">
                  {productCats?.map(c => (
                    <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
                      {c.name}
                      <button onClick={() => handleDeleteCategory(c.id)} className="ml-1 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {!productCats?.length && <p className="text-xs text-muted-foreground">No product categories yet</p>}
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">{t('settings.expenseCategories')}</h4>
                <div className="flex flex-wrap gap-2">
                  {expenseCats?.map(c => (
                    <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
                      {c.name}
                      <button onClick={() => handleDeleteCategory(c.id)} className="ml-1 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {!expenseCats?.length && <p className="text-xs text-muted-foreground">No expense categories yet</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
