import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '#/lib/auth'
import { useT } from '#/lib/i18n'
import { useOwnerExists } from '#/lib/api/invitations'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { UserPlus, Loader2, Eye, EyeOff, ShieldCheck, UserX } from 'lucide-react'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const { signUp } = useAuth()
  const { t } = useT()
  const navigate = useNavigate()
  const { data: ownerExists, isLoading: checkingOwner } = useOwnerExists()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error: err, needsSetup } = await signUp(email, password)
    if (err) {
      setError(err)
      setLoading(false)
    } else if (needsSetup) {
      navigate({ to: '/setup' })
    }
  }

  // Loading state while checking if owner exists
  if (checkingOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Owner already exists — registration is closed
  if (ownerExists) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl shadow-emerald-900/10 dark:shadow-black/30 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30">
              <UserX className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
              {t('auth.registrationClosed')}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {t('auth.registrationClosedDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">{t('auth.ownerRegistered')}</p>
                  <p className="text-amber-600 dark:text-amber-300 text-xs">
                    {t('auth.cashierInviteOnly')}
                  </p>
                </div>
              </div>
            </div>
            <Link to="/login" className="block">
              <Button className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 text-white">
                {t('auth.login')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No owner yet — show owner signup form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl shadow-emerald-900/10 dark:shadow-black/30 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xl shadow-lg shadow-emerald-500/30">
            ET
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            {t('auth.ownerSignup')}
          </CardTitle>
          <CardDescription>{t('auth.ownerSignupSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Owner badge */}
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">{t('auth.ownerBadge')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">{t('auth.email')}</Label>
              <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">{t('auth.password')}</Label>
              <div className="relative">
                <Input id="signup-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="h-11 pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Input id="signup-confirm" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="h-11 pr-10" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              {t('auth.ownerSignup')}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
              {t('auth.login')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
