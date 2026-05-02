# ERP MVP — Build Plan

---

### 1. Authentication & Roles

- Email + password authentication (via Supabase)
- First registered user becomes the **Owner**
- Owners can invite **Cashiers**
- Roles stored in `user_roles` table with Row-Level Security (RLS)
- Owners have full access
- Cashiers can:
  - Access POS screen only
  - View their own sales
- Every user belongs to a **Shop**
- Multi-tenant structure (multiple shops supported in one system)

---

### 2. App Layout (Shell)

- Left sidebar navigation:
  - Dashboard
  - Inventory
  - POS
  - Finance
  - Settings

- Top bar:
  - Shop name
  - Language toggle (EN / አማ)
  - User menu (logout)

- UI:
  - Clean shadcn design
  - Fast and minimal
  - Mobile responsive (PWA-ready)

---

### 3. Dashboard (Main Overview)

- KPI Cards:
  - Today’s Sales
  - Today’s Expenses
  - Today’s Profit
  - Low-stock items
  - Outstanding debts

- Sales chart (last 7 days)
- Top 5 best-selling products
- Recent activity feed (sales, expenses, payments)

---

### 4. Inventory Module

- CRUD products:
  - Name
  - SKU
  - Category
  - Quantity
  - Buying price
  - Selling price
  - Low-stock threshold

- Features:
  - Search and filtering
  - Real-time stock updates
    - Decrease on sale
    - Increase on restock
  - Low-stock alerts on dashboard
  - “Stock In” action:
    - Adds inventory
    - Creates expense entry automatically

---

### 5. POS (Sales Module)

Designed for speed and simplicity.

- Product search + quick add to cart
- Quantity adjustment
- Auto-calculated totals (ETB)
- Payment types:
  - Cash
  - Credit (requires customer selection/creation)

- Complete Sale:
  - Deducts stock
  - Saves transaction
  - Generates receipt

- Receipt includes:
  - Shop name
  - Items
  - Total
  - Date
  - Cashier

- Daily sales log available

---

### 6. Finance / Expenses Module

- Expense tracking:
  - Amount (ETB)
  - Category (rent, salary, utilities, etc.)
  - Date
  - Notes
  - Optional supplier

- Reports:
  - Daily / Weekly / Monthly summaries
  - Revenue, expenses, profit
  - Trend chart

- Export:
  - CSV export (PDF later)

---

### 7. Settings

- Shop profile:
  - Name
  - Address
  - Phone
  - Currency (fixed: ETB)

- Language toggle:
  - English / Amharic

- User management:
  - Invite cashier (email + role)

- Category management:
  - Product categories
  - Expense categories

---

## UX Guidelines

- Currency format: `1,250 ETB`
- Language toggle affects UI only (not user data)
- Empty states guide users clearly
  - Example: “No products yet — add your first product”
- Toast notifications for actions
- Undo option where possible

---

## Technical Details

### Backend

- Supabase (PostgreSQL + Auth)

### Database Tables

- `shops`
- `user_roles`
- `products`
- `customers`
- `suppliers`
- `sales`
- `sale_items`
- `expenses`
- `credit_entries`
- `payments`
- `categories`

---

### Security (RLS)

- All tables scoped by `shop_id`
- Cashier permissions:
  - Insert sales and sale_items
  - Read products only
- Owner permissions:
  - Full access within shop
- Role validation via:
  - `has_role(user_id, shop_id, role)` function

---

### Routes

#### Public

- `/login`
- `/signup`

#### Authenticated

- `/dashboard`
- `/inventory`
- `/inventory/:id`
- `/pos`
- `/sales`
- `/sales/:id` (receipt)
- `/finance`
- `/credits`
- `/settings`

---

### Internationalization (i18n)

- Simple `translations.ts` file
- Hook: `useT()`
- Languages:
  - English (`en`)
  - Amharic (`am`)

---

### State Management

- TanStack Query
- Optimistic updates for POS performance

---

### Charts

- Recharts

---

### Export

- CSV export (client-side)

---

## Out of Scope (V1)

- HR / Payroll
- Full CRM
- Multi-branch support
- Manufacturing module
- VAT / ERCA integration
- Telebirr integration
- Offline mode
- Native mobile app

---
