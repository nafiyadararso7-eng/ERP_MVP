import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '#/lib/supabase'
import { useT } from '#/lib/i18n'
import { useInvitationByToken, acceptInvitation } from '#/lib/api/invitations'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { UserPlus, Loader2, Eye, EyeOff, Store, AlertTriangle, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/join')({
  component: JoinPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
})

function JoinPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const { token } = Route.useSearch()

  const { data: invitation, isLoading: loadingInvite, error: inviteError } = useInvitationByToken(token || null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!invitation?.email) {
      setError('Invalid invitation')
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }

    setLoading(true)
    try {
      // 1. Sign up with the invited email
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
      })

      if (signUpError) {
        // If user already exists, try signing in instead
        if (signUpError.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: invitation.email,
            password,
          })
          if (signInError) {
            setError(t('auth.alreadyRegisteredLogin'))
            setLoading(false)
            return
          }
        } else {
          setError(signUpError.message)
          setLoading(false)
          return
        }
      }

      // 2. Accept the invitation (creates cashier role)
      const result = await acceptInvitation(token)
      if (result?.success) {
        setSuccess(true)
        // Wait a moment then redirect to dashboard
        setTimeout(() => {
          navigate({ to: '/dashboard' })
        }, 2000)
      } else {
        setError('Failed to accept invitation')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Card className="w-full max-w-md border-0 shadow-2xl shadow-emerald-900/10 dark:shadow-black/30 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl">{t('join.noToken')}</CardTitle>
            <CardDescription>{t('join.noTokenDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login" className="block">
              <Button className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                {t('auth.login')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading invitation
  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">{t('join.validating')}</p>
        </div>
      </div>
    )
  }

  // Invalid invitation
  if (inviteError || !invitation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Card className="w-full max-w-md border-0 shadow-2xl shadow-emerald-900/10 dark:shadow-black/30 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl text-destructive">{t('join.invalidInvite')}</CardTitle>
            <CardDescription>{invitation?.error || t('join.invalidInviteDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login" className="block">
              <Button className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                {t('auth.login')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Card className="w-full max-w-md border-0 shadow-2xl shadow-emerald-900/10 dark:shadow-black/30 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl text-emerald-700 dark:text-emerald-400">{t('join.success')}</CardTitle>
            <CardDescription>{t('join.successDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
              <Store className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
              <p className="font-medium text-emerald-800 dark:text-emerald-200">{invitation.shop_name}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{t('join.roleAssigned')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Valid invitation — show cashier signup form
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
            {t('join.title')}
          </CardTitle>
          <CardDescription>{t('join.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Invitation info card */}
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 mb-4">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-emerald-800 dark:text-emerald-200">{invitation.shop_name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('join.invitedAs')}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Email — pre-filled and readonly */}
            <div className="space-y-2">
              <Label htmlFor="join-email">{t('auth.email')}</Label>
              <Input
                id="join-email"
                type="email"
                value={invitation.email || ''}
                readOnly
                className="h-11 bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">{t('join.emailLocked')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="join-password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="join-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 pr-10"
                />
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
              <Label htmlFor="join-confirm">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="join-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 pr-10"
                />
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
              {t('join.createAccount')}
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
