/**
 * Shared TypeScript types for PayLater frontend.
 * Expand as API integration pages are built.
 */

/** JWT role values returned by the backend */
export type UserRole = 'admin' | 'customer' | 'merchant'

/** Authenticated user (from JWT claims after login) */
export interface User {
  userId: number
  email: string
  role: UserRole
}

/** POST /auth/login response */
export interface LoginResponse {
  token: string
}

/** Standard API error envelope from backend */
export interface ApiErrorResponse {
  error: string
}

/** Standard API success message envelope from backend */
export interface ApiMessageResponse {
  message: string
}

/** GET /health response */
export interface HealthResponse {
  status: string
}

/** Customer record from GET /customers */
export interface Customer {
  ID: number
  Name: string
  Email: string
  CreditLimit: string
}

/** POST /customers request body */
export interface CreateCustomerRequest {
  name: string
  email: string
  credit_limit: string
}

/** POST /merchants request body */
export interface CreateMerchantRequest {
  merchant_name: string
  phone_number: string
  onboarding: string
  commission: string
}

/** PUT /merchants/:id request body */
export interface UpdateMerchantCommissionRequest {
  commission: string
}

/** POST /transactions request body */
export interface CreateTransactionRequest {
  customer_id: number
  merchant_id: number
  amount: string
  commission: string
  transaction_date: string
}

/** POST /paybacks request body */
export interface CreatePaybackRequest {
  customer_id: number
  amount: string
  payment_date: string
}

/** GET /reports/merchant-fees row */
export interface MerchantFee {
  MerchantName: string
  Commission: string
}

/** GET /reports/customer-dues row */
export interface CustomerDue {
  customer_id: number
  name: string
  total_transaction: string
  total_repaid: string
  remaining_due: string
}

/** GET /reports/credit-limit row */
export interface CreditLimitCustomer {
  customer_id: number
  name: string
  credit_limit: string
  remaining_due: string
}

/** GET /reports/total-dues response */
export interface TotalDues {
  total_dues: string
}
