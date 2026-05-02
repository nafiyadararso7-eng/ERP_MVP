import { createFileRoute } from '@tanstack/react-router'
import { useT } from '#/lib/i18n'
import { useAuth } from '#/lib/auth'
import { useDashboardStats, useSalesChart, useTopProducts, useRecentActivity } from '#/lib/api/dashboard'
import { formatETB, formatDateTime } from '#/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import {
  DollarSign, TrendingDown, TrendingUp, Package, CreditCard,
  ShoppingCart, Receipt, Banknote,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { t } = useT()
  const { shop, user } = useAuth()
  const { data: stats } = useDashboardStats()
  const { data: chartData } = useSalesChart()
  const { data: topProducts } = useTopProducts()
  const { data: recentActivity } = useRecentActivity()

  const kpis = [
    { label: t('dashboard.todaySales'), value: formatETB(stats?.todaySales || 0), icon: DollarSign, color: 'from-emerald-500 to-green-500', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: t('dashboard.todayExpenses'), value: formatETB(stats?.todayExpenses || 0), icon: TrendingDown, color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50 dark:bg-orange-950/30' },
    { label: t('dashboard.todayProfit'), value: formatETB(stats?.todayProfit || 0), icon: TrendingUp, color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: t('dashboard.lowStock'), value: String(stats?.lowStockCount || 0), icon: Package, color: 'from-amber-500 to-yellow-500', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: t('dashboard.outstandingDebts'), value: formatETB(stats?.outstandingDebts || 0), icon: CreditCard, color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
  ]

  const activityIcons: Record<string, typeof DollarSign> = {
    sale: ShoppingCart,
    expense: Receipt,
    payment: Banknote,
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('dashboard.welcome')}, {user?.email?.split('@')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{shop?.name}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                    <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                  </div>
                  <div className={`p-2 rounded-xl ${kpi.bgColor}`}>
                    <Icon className={`h-5 w-5 bg-gradient-to-r ${kpi.color} bg-clip-text`} style={{ color: 'var(--emerald-600, #059669)' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t('dashboard.salesChart')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [formatETB(value), 'Sales']}
                    />
                    <Bar dataKey="total" fill="url(#salesGradient)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  {t('common.noData')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t('dashboard.topProducts')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts && topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        #{i + 1}
                      </div>
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{p.totalQty} sold</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('dashboard.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((a) => {
                const Icon = activityIcons[a.type] || Receipt
                return (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        a.type === 'sale' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                        a.type === 'expense' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{a.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${
                      a.type === 'sale' ? 'text-emerald-600' :
                      a.type === 'expense' ? 'text-red-500' :
                      'text-blue-600'
                    }`}>
                      {a.type === 'expense' ? '-' : '+'}{formatETB(a.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t('common.noData')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
