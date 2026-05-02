import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '#/lib/auth'
import { useT } from '#/lib/i18n'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Store, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/setup')({
  component: SetupPage,
})

function SetupPage() {
  const { createShop } = useAuth()
  const { t } = useT()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Shop name is required'); return }
    setError('')
    setLoading(true)

    const { error: err } = await createShop(name, address, phone)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      navigate({ to: '/dashboard' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-400/15 to-teal-400/15 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl shadow-emerald-900/10 dark:shadow-black/30 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <Store className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            {t('setup.title')}
          </CardTitle>
          <CardDescription>{t('setup.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="setup-name">{t('setup.shopName')} *</Label>
              <Input id="setup-name" value={name} onChange={e => setName(e.target.value)} placeholder="My Shop" required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-address">{t('setup.address')}</Label>
              <Input id="setup-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Addis Ababa" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-phone">{t('setup.phone')}</Label>
              <Input id="setup-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251 9XX XXX XXX" className="h-11" />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              💰 Currency: <strong>ETB (Ethiopian Birr)</strong> — locked for all transactions
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Store className="h-4 w-4 mr-2" />}
              {t('setup.create')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
