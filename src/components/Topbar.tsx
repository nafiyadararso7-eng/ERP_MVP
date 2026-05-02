import { useAuth } from '#/lib/auth'
import { useT } from '#/lib/i18n'
import { useTheme } from '#/lib/theme'
import { Sun, Moon, LogOut, Globe, Menu, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useState } from 'react'

export function Topbar({ onMobileMenuToggle, mobileMenuOpen }: { onMobileMenuToggle?: () => void; mobileMenuOpen?: boolean }) {
  const { shop, user, signOut } = useAuth()
  const { language, setLanguage, t } = useT()
  const { resolvedTheme, setTheme } = useTheme()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  const toggleLang = () => setLanguage(language === 'en' ? 'am' : 'en')
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div>
          <h2 className="text-sm font-semibold text-foreground">{shop?.name || 'My Shop'}</h2>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLang}
          className="gap-1.5 text-xs font-medium"
        >
          <Globe className="h-4 w-4" />
          <span>{language === 'en' ? 'አማ' : 'EN'}</span>
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Sign Out */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t('auth.logout')}</span>
        </Button>
      </div>
    </header>
  )
}
