import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

// ============================================
// Translation strings — EN + AM
// ============================================
const translations = {
  // App
  'app.name': { en: 'Ethiopia ERP', am: 'ኢትዮጵያ ኢአርፒ' },
  'app.currency': { en: 'ETB', am: 'ብር' },

  // Nav
  'nav.dashboard': { en: 'Dashboard', am: 'ዳሽቦርድ' },
  'nav.inventory': { en: 'Inventory', am: 'ክምችት' },
  'nav.pos': { en: 'POS', am: 'ሽያጭ' },
  'nav.sales': { en: 'Sales', am: 'ሽያጮች' },
  'nav.finance': { en: 'Finance', am: 'ፋይናንስ' },
  'nav.credits': { en: 'Credits', am: 'ብድሮች' },
  'nav.settings': { en: 'Settings', am: 'ቅንብሮች' },

  // Auth
  'auth.login': { en: 'Sign In', am: 'ግባ' },
  'auth.signup': { en: 'Sign Up', am: 'ተመዝገብ' },
  'auth.logout': { en: 'Sign Out', am: 'ውጣ' },
  'auth.email': { en: 'Email', am: 'ኢሜይል' },
  'auth.password': { en: 'Password', am: 'የይለፍ ቃል' },
  'auth.confirmPassword': { en: 'Confirm Password', am: 'የይለፍ ቃል አረጋግጥ' },
  'auth.noAccount': { en: "Don't have an account?", am: 'መለያ የሎትም?' },
  'auth.hasAccount': { en: 'Already have an account?', am: 'መለያ አሎት?' },
  'auth.loginSubtitle': { en: 'Sign in to manage your business', am: 'ንግድዎን ለማስተዳደር ይግቡ' },
  'auth.signupSubtitle': { en: 'Create your business account', am: 'የንግድ መለያዎን ይፍጠሩ' },
  'auth.ownerSignup': { en: 'Owner Sign Up', am: 'ባለቤት ተመዝገብ' },
  'auth.ownerSignupSubtitle': { en: 'Register as the business owner', am: 'እንደ ንግድ ባለቤት ይመዝገቡ' },
  'auth.ownerBadge': { en: 'You are registering as the shop owner. Only one owner is allowed.', am: 'እንደ ሱቅ ባለቤት እየተመዘገቡ ነው። አንድ ባለቤት ብቻ ይፈቀዳል።' },
  'auth.registrationClosed': { en: 'Registration Closed', am: 'ምዝገባ ተዘግቷል' },
  'auth.registrationClosedDesc': { en: 'The owner account has already been created. Cashiers must be invited by the owner.', am: 'የባለቤት መለያ ቀድሞ ተፈጥሯል። ገንዘብ ተቀባዮች በባለቤቱ መጋበዝ አለባቸው።' },
  'auth.ownerRegistered': { en: 'An owner is already registered', am: 'ባለቤት ቀድሞ ተመዝግቧል' },
  'auth.cashierInviteOnly': { en: 'Cashiers can only join via an invitation link from the owner.', am: 'ገንዘብ ተቀባዮች ከባለቤቱ በተላከ የግብዣ ሊንክ ብቻ መቀላቀል ይችላሉ።' },
  'auth.passwordsNoMatch': { en: 'Passwords do not match', am: 'የይለፍ ቃሎች አይመሳሰሉም' },
  'auth.passwordMinLength': { en: 'Password must be at least 6 characters', am: 'የይለፍ ቃል ቢያንስ 6 ቁምፊ መሆን አለበት' },
  'auth.alreadyRegisteredLogin': { en: 'This email is already registered. Please log in instead.', am: 'ይህ ኢሜይል ቀድሞ ተመዝግቧል። እባክዎ ይግቡ።' },

  // Join (cashier invitation)
  'join.title': { en: 'Join as Cashier', am: 'እንደ ገንዘብ ተቀባይ ይቀላቀሉ' },
  'join.subtitle': { en: 'Set up your account to start working', am: 'ለመጀመር መለያዎን ያዘጋጁ' },
  'join.invitedAs': { en: 'You are invited as a cashier', am: 'እንደ ገንዘብ ተቀባይ ተጋብዘዋል' },
  'join.emailLocked': { en: 'This email was set by the owner and cannot be changed.', am: 'ይህ ኢሜይል በባለቤቱ የተቀመጠ ሲሆን ሊቀየር አይችልም።' },
  'join.createAccount': { en: 'Create Account & Join', am: 'መለያ ፍጠር እና ተቀላቀል' },
  'join.noToken': { en: 'Missing Invitation', am: 'ግብዣ ጠፍቷል' },
  'join.noTokenDesc': { en: 'No invitation token found. Please use the link provided by the shop owner.', am: 'የግብዣ ቶከን አልተገኘም። እባክዎ በሱቅ ባለቤቱ የተሰጠውን ሊንክ ይጠቀሙ።' },
  'join.validating': { en: 'Validating invitation...', am: 'ግብዣ በማረጋገጥ ላይ...' },
  'join.invalidInvite': { en: 'Invalid Invitation', am: 'ልክ ያልሆነ ግብዣ' },
  'join.invalidInviteDesc': { en: 'This invitation link is invalid, expired, or already used.', am: 'ይህ የግብዣ ሊንክ ልክ ያልሆነ፣ ጊዜው ያለፈ ወይም ጥቅም ላይ የዋለ ነው።' },
  'join.success': { en: 'Welcome Aboard!', am: 'እንኳን ደህና መጡ!' },
  'join.successDesc': { en: 'Your account has been created. Redirecting to dashboard...', am: 'መለያዎ ተፈጥሯል። ወደ ዳሽቦርድ በማዘዋወር ላይ...' },
  'join.roleAssigned': { en: 'Cashier role assigned', am: 'የገንዘብ ተቀባይ ሚና ተመድቧል' },

  // Shop Setup
  'setup.title': { en: 'Set Up Your Shop', am: 'ሱቅዎን ያዘጋጁ' },
  'setup.subtitle': { en: 'Tell us about your business to get started', am: 'ለመጀመር ስለ ንግድዎ ይንገሩን' },
  'setup.shopName': { en: 'Shop Name', am: 'የሱቅ ስም' },
  'setup.address': { en: 'Address', am: 'አድራሻ' },
  'setup.phone': { en: 'Phone', am: 'ስልክ' },
  'setup.create': { en: 'Create Shop', am: 'ሱቅ ፍጠር' },

  // Dashboard
  'dashboard.title': { en: 'Dashboard', am: 'ዳሽቦርድ' },
  'dashboard.todaySales': { en: "Today's Sales", am: 'የዛሬ ሽያጭ' },
  'dashboard.todayExpenses': { en: "Today's Expenses", am: 'የዛሬ ወጪዎች' },
  'dashboard.todayProfit': { en: "Today's Profit", am: 'የዛሬ ትርፍ' },
  'dashboard.lowStock': { en: 'Low Stock Items', am: 'አነስተኛ ክምችት' },
  'dashboard.outstandingDebts': { en: 'Outstanding Debts', am: 'ያልተከፈሉ ብድሮች' },
  'dashboard.salesChart': { en: 'Sales (Last 7 Days)', am: 'ሽያጭ (ባለፉት 7 ቀናት)' },
  'dashboard.topProducts': { en: 'Top 5 Products', am: 'ምርጥ 5 ምርቶች' },
  'dashboard.recentActivity': { en: 'Recent Activity', am: 'የቅርብ ጊዜ እንቅስቃሴ' },
  'dashboard.welcome': { en: 'Welcome back', am: 'እንኳን ደህና መጡ' },

  // Inventory
  'inventory.title': { en: 'Inventory', am: 'ክምችት' },
  'inventory.addProduct': { en: 'Add Product', am: 'ምርት ጨምር' },
  'inventory.editProduct': { en: 'Edit Product', am: 'ምርት አስተካክል' },
  'inventory.productName': { en: 'Product Name', am: 'የምርት ስም' },
  'inventory.sku': { en: 'SKU', am: 'ኤስኬዩ' },
  'inventory.category': { en: 'Category', am: 'ምድብ' },
  'inventory.quantity': { en: 'Quantity', am: 'ብዛት' },
  'inventory.buyingPrice': { en: 'Buying Price', am: 'የግዢ ዋጋ' },
  'inventory.sellingPrice': { en: 'Selling Price', am: 'የሽያጭ ዋጋ' },
  'inventory.lowStockThreshold': { en: 'Low Stock Alert', am: 'ዝቅተኛ ክምችት ማስጠንቀቂያ' },
  'inventory.search': { en: 'Search products...', am: 'ምርቶችን ይፈልጉ...' },
  'inventory.noProducts': { en: 'No products yet', am: 'ገና ምንም ምርቶች የሉም' },
  'inventory.noProductsDesc': { en: 'Add your first product to get started', am: 'ለመጀመር የመጀመሪያውን ምርት ያስገቡ' },
  'inventory.restock': { en: 'Restock', am: 'እንደገና አስገባ' },
  'inventory.inStock': { en: 'In Stock', am: 'በክምችት ውስጥ' },
  'inventory.lowStock': { en: 'Low Stock', am: 'ዝቅተኛ ክምችት' },
  'inventory.outOfStock': { en: 'Out of Stock', am: 'ክምችት አልቋል' },
  'inventory.allCategories': { en: 'All Categories', am: 'ሁሉም ምድቦች' },
  'inventory.deleteConfirm': { en: 'Are you sure you want to delete this product?', am: 'ይህን ምርት መሰረዝ ይፈልጋሉ?' },

  // POS
  'pos.title': { en: 'Point of Sale', am: 'ሽያጭ ማዕከል' },
  'pos.searchProducts': { en: 'Search products...', am: 'ምርቶችን ይፈልጉ...' },
  'pos.cart': { en: 'Cart', am: 'ጋሪ' },
  'pos.emptyCart': { en: 'Cart is empty', am: 'ጋሪው ባዶ ነው' },
  'pos.emptyCartDesc': { en: 'Add products to start a sale', am: 'ሽያጭ ለመጀመር ምርቶች ያስገቡ' },
  'pos.total': { en: 'Total', am: 'ድምር' },
  'pos.completeSale': { en: 'Complete Sale', am: 'ሽያጭ ጨርስ' },
  'pos.cash': { en: 'Cash', am: 'ጥሬ ገንዘብ' },
  'pos.credit': { en: 'Credit', am: 'ብድር' },
  'pos.selectCustomer': { en: 'Select Customer', am: 'ደንበኛ ይምረጡ' },
  'pos.addCustomer': { en: 'Add Customer', am: 'ደንበኛ ጨምር' },
  'pos.customerName': { en: 'Customer Name', am: 'የደንበኛ ስም' },
  'pos.customerPhone': { en: 'Customer Phone', am: 'የደንበኛ ስልክ' },
  'pos.saleComplete': { en: 'Sale completed!', am: 'ሽያጩ ተጠናቀቀ!' },

  // Sales
  'sales.title': { en: 'Sales Log', am: 'የሽያጭ ዝርዝር' },
  'sales.receipt': { en: 'Receipt', am: 'ደረሰኝ' },
  'sales.date': { en: 'Date', am: 'ቀን' },
  'sales.cashier': { en: 'Cashier', am: 'ገንዘብ ተቀባይ' },
  'sales.items': { en: 'Items', am: 'ዕቃዎች' },
  'sales.paymentType': { en: 'Payment', am: 'ክፍያ' },
  'sales.print': { en: 'Print', am: 'አትም' },
  'sales.share': { en: 'Share', am: 'አጋራ' },
  'sales.noSales': { en: 'No sales yet', am: 'ገና ምንም ሽያጭ የለም' },
  'sales.noSalesDesc': { en: 'Complete your first sale from the POS', am: 'ከሽያጭ ማዕከል የመጀመሪያ ሽያጩን ያጠናቅቁ' },

  // Finance
  'finance.title': { en: 'Finance', am: 'ፋይናንስ' },
  'finance.addExpense': { en: 'Add Expense', am: 'ወጪ ጨምር' },
  'finance.amount': { en: 'Amount', am: 'ብዛት' },
  'finance.expenseCategory': { en: 'Category', am: 'ምድብ' },
  'finance.date': { en: 'Date', am: 'ቀን' },
  'finance.note': { en: 'Note', am: 'ማስታወሻ' },
  'finance.supplier': { en: 'Supplier', am: 'አቅራቢ' },
  'finance.revenue': { en: 'Revenue', am: 'ገቢ' },
  'finance.expenses': { en: 'Expenses', am: 'ወጪዎች' },
  'finance.grossProfit': { en: 'Gross Profit', am: 'ጠቅላላ ትርፍ' },
  'finance.daily': { en: 'Daily', am: 'ዕለታዊ' },
  'finance.weekly': { en: 'Weekly', am: 'ሳምንታዊ' },
  'finance.monthly': { en: 'Monthly', am: 'ወርሃዊ' },
  'finance.exportCsv': { en: 'Export CSV', am: 'ወደ CSV ላክ' },
  'finance.noExpenses': { en: 'No expenses yet', am: 'ገና ምንም ወጪ የለም' },

  // Credits
  'credits.title': { en: 'Credits & Debts', am: 'ብድሮች' },
  'credits.outstanding': { en: 'Outstanding', am: 'ያልተከፈለ' },
  'credits.paid': { en: 'Paid', am: 'ተከፍሏል' },
  'credits.partial': { en: 'Partial', am: 'በከፊል' },
  'credits.recordPayment': { en: 'Record Payment', am: 'ክፍያ መዝግብ' },
  'credits.paymentAmount': { en: 'Payment Amount', am: 'የክፍያ ብዛት' },
  'credits.totalOwed': { en: 'Total Owed', am: 'ጠቅላላ ዕዳ' },
  'credits.totalPaid': { en: 'Total Paid', am: 'ጠቅላላ የተከፈለ' },
  'credits.balance': { en: 'Balance', am: 'ቀሪ' },
  'credits.noCredits': { en: 'No outstanding credits', am: 'ያልተከፈሉ ብድሮች የሉም' },

  // Settings
  'settings.title': { en: 'Settings', am: 'ቅንብሮች' },
  'settings.shopProfile': { en: 'Shop Profile', am: 'የሱቅ መገለጫ' },
  'settings.language': { en: 'Language', am: 'ቋንቋ' },
  'settings.inviteCashier': { en: 'Invite Cashier', am: 'ገንዘብ ተቀባይ ጋብዝ' },
  'settings.categories': { en: 'Categories', am: 'ምድቦች' },
  'settings.productCategories': { en: 'Product Categories', am: 'የምርት ምድቦች' },
  'settings.expenseCategories': { en: 'Expense Categories', am: 'የወጪ ምድቦች' },
  'settings.addCategory': { en: 'Add Category', am: 'ምድብ ጨምር' },
  'settings.categoryName': { en: 'Category Name', am: 'የምድብ ስም' },
  'settings.saved': { en: 'Settings saved!', am: 'ቅንብሮች ተቀምጠዋል!' },
  'settings.theme': { en: 'Theme', am: 'ገጽታ' },
  'settings.light': { en: 'Light', am: 'ብሩህ' },
  'settings.dark': { en: 'Dark', am: 'ጨለማ' },
  'settings.system': { en: 'System', am: 'ሲስተም' },
  'settings.inviteLinkReady': { en: 'Invitation link ready! Share it with the cashier:', am: 'የግብዣ ሊንክ ዝግጁ ነው! ለገንዘብ ተቀባዩ ያጋሩ:' },
  'settings.linkCopied': { en: 'Link copied to clipboard!', am: 'ሊንክ ተቀድቷል!' },
  'settings.shareInstructions': { en: 'Share this link via WhatsApp, SMS, or email. The cashier will use it to create their account.', am: 'ይህን ሊንክ በWhatsApp፣ SMS ወይም ኢሜይል ያጋሩ። ገንዘብ ተቀባዩ መለያውን ለመፍጠር ይጠቀማል።' },
  'settings.invitations': { en: 'Invitations', am: 'ግብዣዎች' },
  'settings.noInvitations': { en: 'No invitations sent yet', am: 'ገና ምንም ግብዣ አልተላከም' },
  'settings.inviteAccepted': { en: 'Accepted', am: 'ተቀብሏል' },
  'settings.invitePending': { en: 'Pending', am: 'በመጠባበቅ ላይ' },
  'settings.inviteSent': { en: 'Invitation created! Share the link with the cashier.', am: 'ግብዣ ተፈጥሯል! ሊንኩን ለገንዘብ ተቀባዩ ያጋሩ።' },
  'settings.inviteExisting': { en: 'An invitation already exists for this email. Link is shown below.', am: 'ለዚህ ኢሜይል ግብዣ ቀድሞ አለ። ሊንኩ ከታች ይታያል።' },
  'settings.inviteRevoked': { en: 'Invitation revoked', am: 'ግብዣ ተሰርዟል' },
  'settings.copyLink': { en: 'Copy invite link', am: 'የግብዣ ሊንክ ቅዳ' },
  'settings.revokeInvite': { en: 'Revoke invitation', am: 'ግብዣ ሰርዝ' },

  // Common
  'common.save': { en: 'Save', am: 'አስቀምጥ' },
  'common.cancel': { en: 'Cancel', am: 'ሰርዝ' },
  'common.delete': { en: 'Delete', am: 'ሰርዝ' },
  'common.edit': { en: 'Edit', am: 'አስተካክል' },
  'common.add': { en: 'Add', am: 'ጨምር' },
  'common.close': { en: 'Close', am: 'ዝጋ' },
  'common.loading': { en: 'Loading...', am: 'በመጫን ላይ...' },
  'common.error': { en: 'Something went wrong', am: 'ችግር ተፈጥሯል' },
  'common.success': { en: 'Success!', am: 'ተሳክቷል!' },
  'common.confirm': { en: 'Confirm', am: 'አረጋግጥ' },
  'common.actions': { en: 'Actions', am: 'ድርጊቶች' },
  'common.name': { en: 'Name', am: 'ስም' },
  'common.status': { en: 'Status', am: 'ሁኔታ' },
  'common.total': { en: 'Total', am: 'ድምር' },
  'common.price': { en: 'Price', am: 'ዋጋ' },
  'common.noData': { en: 'No data', am: 'መረጃ የለም' },
} as const

type TranslationKey = keyof typeof translations
type Language = 'en' | 'am'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('erp-language') as Language) || 'en'
    }
    return 'en'
  })

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp-language', lang)
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = translations[key]
      if (!entry) return key
      return entry[language] || entry.en || key
    },
    [language]
  )

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useT() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useT must be used within an I18nProvider')
  }
  return context
}

export { type TranslationKey, type Language }
