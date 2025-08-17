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
  paymentMethod: 'bank_transfer' | 'wire' | 'ach' | 'check' | 'cash' | 'card';
  transactionDate: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'reversed';
  customerId?: string;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
  account?: {
    accountName: string;
    bankName: string;
    accountNumber: string;
  };
  customer?: {
    companyName: string;
  };
  supplier?: {
    supplierName: string;
  };
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
  paymentTerms: string;
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
  paymentTerms: string;
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

export interface MoneyTransactionData {
  accountId: string;
  amount: number;
  description: string;
  paymentMethod?: 'bank_transfer' | 'wire' | 'ach' | 'check' | 'cash' | 'card';
  reference?: string;
  customerId?: string;
  supplierId?: string;
}

// ========== API FUNCTIONS ==========

// Bank Accounts
export const getBankAccounts = async () => {
  try {
    const response = await api.get('/api/banking/accounts');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

export const getBankAccountById = async (accountId: string) => {
  try {
    const response = await api.get(`/api/banking/accounts/${accountId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

export const createBankAccount = async (data: CreateBankAccountData) => {
  try {
    const response = await api.post('/api/banking/accounts', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

export const updateBankAccount = async (accountId: string, data: UpdateBankAccountData) => {
  try {
    const response = await api.put(`/api/banking/accounts/${accountId}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

export const deactivateBankAccount = async (accountId: string) => {
  try {
    const response = await api.delete(`/api/banking/accounts/${accountId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Transactions
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

export const sendMoney = async (data: MoneyTransactionData) => {
  try {
    const response = await api.post('/api/banking/send-money', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

export const receiveMoney = async (data: MoneyTransactionData) => {
  try {
    const response = await api.post('/api/banking/receive-money', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Balances
export const getCustomerBalances = async () => {
  try {
    const response = await api.get('/api/banking/customer-balances');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

export const getSupplierBalances = async () => {
  try {
    const response = await api.get('/api/banking/supplier-balances');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

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
      return 'text-gray-600';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    case 'reversed':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'bank_transfer':
      return <Landmark className="w-4 h-4 text-blue-500" />;
    case 'wire':
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    case 'ach':
      return <Banknote className="w-4 h-4 text-purple-500" />;
    case 'check':
      return <CreditCard className="w-4 h-4 text-orange-500" />;
    case 'cash':
      return <DollarSign className="w-4 h-4 text-green-600" />;
    case 'card':
      return <CreditCard className="w-4 h-4 text-blue-600" />;
    default:
      return <DollarSign className="w-4 h-4 text-gray-500" />;
  }
};