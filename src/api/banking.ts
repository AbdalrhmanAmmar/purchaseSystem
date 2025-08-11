// banking.ts - API client for banking operations

import api from './api';

// ========== TYPE DEFINITIONS ==========

export interface BankAccount {
  _id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  accountType: 'checking' | 'savings' | 'business' | 'money_market';
  balance: number;
  currency: string;
  isActive: boolean;
  openingDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransaction {
  _id: string;
  accountId: string;
  transactionType: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  balance: number;
  description: string;
  reference?: string;
  paymentMethod: 'bank_transfer' | 'wire' | 'ach' | 'check' | 'cash';
  transactionDate: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  recipientType?: 'customer' | 'supplier' | 'internal';
  recipientId?: string;
  customerId?: string;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerBalance {
  _id: string;
  customerId: string;
  customerName: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierBalance {
  _id: string;
  supplierId: string;
  supplierName: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankAccountData {
  accountName: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  accountType: 'checking' | 'savings' | 'business' | 'money_market';
  balance?: number;
  currency?: string;
  description?: string;
}

export interface UpdateBankAccountData {
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  accountType?: 'checking' | 'savings' | 'business' | 'money_market';
  description?: string;
}

export interface SendMoneyData {
  accountId: string;
  recipientType: 'customer' | 'supplier';
  recipientId: string;
  amount: number;
  description: string;
  paymentMethod?: 'bank_transfer' | 'wire' | 'ach' | 'check';
  reference?: string;
}

export interface ReceiveMoneyData {
  accountId: string;
  customerId: string;
  amount: number;
  description: string;
  paymentMethod?: 'bank_transfer' | 'wire' | 'ach' | 'check' | 'cash';
  reference?: string;
}

// ========== API FUNCTIONS ==========

// Description: Get all bank accounts
// Endpoint: GET /api/banking/accounts
// Request: {}
// Response: { success: boolean, accounts: BankAccount[] }
export const getBankAccounts = async () => {
  try {
    const response = await api.get('/api/banking/accounts');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get bank account by ID
// Endpoint: GET /api/banking/accounts/:id
// Request: {}
// Response: { success: boolean, account: BankAccount }
export const getBankAccountById = async (accountId: string) => {
  try {
    const response = await api.get(`/api/banking/accounts/${accountId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Create new bank account
// Endpoint: POST /api/banking/accounts
// Request: CreateBankAccountData
// Response: { success: boolean, account: BankAccount, message: string }
export const createBankAccount = async (data: CreateBankAccountData) => {
  try {
    const response = await api.post('/api/banking/accounts', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update bank account
// Endpoint: PUT /api/banking/accounts/:id
// Request: UpdateBankAccountData
// Response: { success: boolean, account: BankAccount, message: string }
export const updateBankAccount = async (accountId: string, data: UpdateBankAccountData) => {
  try {
    const response = await api.put(`/api/banking/accounts/${accountId}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Deactivate bank account
// Endpoint: DELETE /api/banking/accounts/:id
// Request: {}
// Response: { success: boolean, message: string, account: BankAccount }
export const deactivateBankAccount = async (accountId: string) => {
  try {
    const response = await api.delete(`/api/banking/accounts/${accountId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get bank account transactions
// Endpoint: GET /api/banking/accounts/:id/transactions
// Request: { limit?: number, offset?: number }
// Response: { success: boolean, transactions: BankTransaction[] }
export const getBankTransactions = async (accountId: string, limit: number = 100, offset: number = 0) => {
  try {
    const response = await api.get(`/api/banking/accounts/${accountId}/transactions`, {
      params: { limit, offset }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Send money to recipient
// Endpoint: POST /api/banking/send-money
// Request: SendMoneyData
// Response: { success: boolean, transaction: BankTransaction, message: string }
export const sendMoney = async (data: SendMoneyData) => {
  try {
    const response = await api.post('/api/banking/send-money', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Receive money from customer
// Endpoint: POST /api/banking/receive-money
// Request: ReceiveMoneyData
// Response: { success: boolean, transaction: BankTransaction, message: string }
export const receiveMoney = async (data: ReceiveMoneyData) => {
  try {
    const response = await api.post('/api/banking/receive-money', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get customer balances
// Endpoint: GET /api/banking/customer-balances
// Request: {}
// Response: { success: boolean, balances: CustomerBalance[] }
export const getCustomerBalances = async () => {
  try {
    const response = await api.get('/api/banking/customer-balances');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get supplier balances
// Endpoint: GET /api/banking/supplier-balances
// Request: {}
// Response: { success: boolean, balances: SupplierBalance[] }
export const getSupplierBalances = async () => {
  try {
    const response = await api.get('/api/banking/supplier-balances');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update customer balance
// Endpoint: PUT /api/banking/customer-balances/:id
// Request: { outstandingChange?: number, paymentAmount?: number }
// Response: { success: boolean, balance: CustomerBalance, message: string }
export const updateCustomerBalance = async (
  customerId: string,
  outstandingChange: number = 0,
  paymentAmount: number = 0
) => {
  try {
    const response = await api.put(`/api/banking/customer-balances/${customerId}`, {
      outstandingChange,
      paymentAmount
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update supplier balance
// Endpoint: PUT /api/banking/supplier-balances/:id
// Request: { outstandingChange?: number, paymentAmount?: number }
// Response: { success: boolean, balance: SupplierBalance, message: string }
export const updateSupplierBalance = async (
  supplierId: string,
  outstandingChange: number = 0,
  paymentAmount: number = 0
) => {
  try {
    const response = await api.put(`/api/banking/supplier-balances/${supplierId}`, {
      outstandingChange,
      paymentAmount
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Sync all balances
// Endpoint: POST /api/banking/sync-balances
// Request: {}
// Response: { success: boolean, message: string }
export const syncBalances = async () => {
  try {
    const response = await api.post('/api/banking/sync-balances');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// ========== UTILITY FUNCTIONS ==========

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length <= 4) return accountNumber;
  const masked = '*'.repeat(accountNumber.length - 4);
  const lastFour = accountNumber.slice(-4);
  return `${masked}${lastFour}`;
};

export const getTransactionTypeColor = (type: string): string => {
  switch (type) {
    case 'deposit':
      return 'text-green-600';
    case 'withdrawal':
      return 'text-red-600';
    case 'transfer':
      return 'text-blue-600';
    default:
      return 'text-slate-600';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};