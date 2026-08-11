import { Route, Routes } from 'react-router-dom'

import { AppLayout } from '../layouts/AppLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { Customers } from '../pages/customers/Customers'
import { Merchants } from '../pages/merchants/Merchants'
import { Paybacks } from '../pages/paybacks/Paybacks'
import { Reports } from '../pages/reports/Reports'
import { Settings } from '../pages/settings/Settings'
import { Transactions } from '../pages/transactions/Transactions'
import { AdminDashboard } from '../pages/dashboard/AdminDashboard'
import { CustomerDashboard } from '../pages/dashboard/CustomerDashboard'
import { MerchantDashboard } from '../pages/dashboard/MerchantDashboard'
import { Home } from '../pages/Home'
import { Login } from '../pages/Login'
import { NotFound } from '../pages/NotFound'
import { Register } from '../pages/Register'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGuard } from './RoleGuard'

/**
 * Application route definitions.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />

          <Route element={<RoleGuard allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['admin', 'merchant']} />}>
            <Route path="/merchants" element={<Merchants />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['admin', 'customer']} />}>
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/paybacks" element={<Paybacks />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['customer']} />}>
            <Route path="/customer" element={<CustomerDashboard />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['merchant']} />}>
            <Route path="/merchant" element={<MerchantDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
