import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  getBankAccounts, 
  getBankTransactions, 
  sendMoney, 
  receiveMoney, 
  getCustomerBalances, 
  getSupplierBalances,
  createBankAccount,
  BankAccount,
  BankTransaction,
  CustomerBalance,
  SupplierBalance,
  formatCurrency,
  formatAccountNumber,
  getTransactionTypeColor,
  getStatusColor
} from "@/api/banking"
import { getClients, Client } from "@/api/clients"
import { getSuppliers, Supplier } from "@/api/suppliers"
import { useToast } from "@/hooks/useToast"
import { useForm } from 'react-hook-form'
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Users,
  Factory,
  Plus,
  Search,
  Filter,
  Eye,
  Send,
  Download,
  Banknote,
  Landmark
} from "lucide-react"

export function Banking() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [customerBalances, setCustomerBalances] = useState<CustomerBalance[]>([])
  const [supplierBalances, setSupplierBalances] = useState<SupplierBalance[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [sendMoneyDialogOpen, setSendMoneyDialogOpen] = useState(false)
  const [receiveMoneyDialogOpen, setReceiveMoneyDialogOpen] = useState(false)
  const [createAccountDialogOpen, setCreateAccountDialogOpen] = useState(false)
  const { toast } = useToast()

  const { 
    register: registerSend, 
    handleSubmit: handleSendSubmit, 
    formState: { errors: sendErrors }, 
    reset: resetSend, 
    setValue: setSendValue,
    watch: watchSend
  } = useForm<{
    accountId: string;
    recipientType: 'customer' | 'supplier';
    recipientId: string;
    amount: number;
    description: string;
    paymentMethod?: 'bank_transfer' | 'wire' | 'ach' | 'check';
    reference?: string;
  }>({
    defaultValues: {
      accountId: selectedAccount,
      recipientType: 'customer'
    }
  })

  const { 
    register: registerReceive, 
    handleSubmit: handleReceiveSubmit, 
    formState: { errors: receiveErrors }, 
    reset: resetReceive, 
    setValue: setReceiveValue 
  } = useForm<{
    accountId: string;
    customerId: string;
    amount: number;
    description: string;
    paymentMethod?: 'bank_transfer' | 'wire' | 'ach' | 'check' | 'cash';
    reference?: string;
  }>({
    defaultValues: {
      accountId: selectedAccount
    }
  })

  const { 
    register: registerCreateAccount, 
    handleSubmit: handleCreateAccountSubmit, 
    formState: { errors: createAccountErrors }, 
    reset: resetCreateAccount 
  } = useForm<{
    accountName: string;
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    accountType: string;
    balance?: number;
    currency: string;
    description?: string;
  }>({
    defaultValues: {
      accountType: 'checking',
      currency: 'USD',
      balance: 0
    }
  })

  const recipientType = watchSend('recipientType')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [
          accountsResponse, 
          customerBalancesResponse, 
          supplierBalancesResponse, 
          clientsResponse, 
          suppliersResponse
        ] = await Promise.all([
          getBankAccounts(),
          getCustomerBalances(),
          getSupplierBalances(),
          getClients(),
          getSuppliers()
        ])

        setAccounts(accountsResponse.accounts || [])
        setCustomerBalances(customerBalancesResponse.balances || [])
        setSupplierBalances(supplierBalancesResponse.balances || [])
        setClients(clientsResponse.clients || [])
        setSuppliers(suppliersResponse.suppliers || [])

        if (accountsResponse.accounts?.length > 0) {
          setSelectedAccount(accountsResponse.accounts[0]._id)
        }
      } catch (error: any) {
        console.error('Error fetching banking data:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to load banking data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedAccount) return

      try {
        const response = await getBankTransactions(selectedAccount)
        setTransactions(response.transactions || [])
      } catch (error: any) {
        console.error('Error fetching transactions:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to load transactions",
          variant: "destructive",
        })
      }
    }

    fetchTransactions()
  }, [selectedAccount, toast])

  const onSendMoney = async (data: any) => {
    try {
      const response = await sendMoney({ 
        ...data, 
        accountId: selectedAccount 
      })
      
      setSendMoneyDialogOpen(false)
      resetSend()
      
      // Refresh transactions
      const transactionsResponse = await getBankTransactions(selectedAccount)
      setTransactions(transactionsResponse.transactions || [])
      
      // Refresh balances based on recipient type
      if (data.recipientType === 'customer') {
        const balancesResponse = await getCustomerBalances()
        setCustomerBalances(balancesResponse.balances || [])
      } else {
        const balancesResponse = await getSupplierBalances()
        setSupplierBalances(balancesResponse.balances || [])
      }

      toast({
        title: "Success",
        description: response.message || "Payment sent successfully",
      })
    } catch (error: any) {
      console.error('Error sending money:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send money",
        variant: "destructive",
      })
    }
  }

  const onReceiveMoney = async (data: any) => {
    try {
      const response = await receiveMoney({ 
        ...data, 
        accountId: selectedAccount 
      })
      
      setReceiveMoneyDialogOpen(false)
      resetReceive()
      
      // Refresh transactions and customer balances
      const [transactionsResponse, balancesResponse] = await Promise.all([
        getBankTransactions(selectedAccount),
        getCustomerBalances()
      ])
      
      setTransactions(transactionsResponse.transactions || [])
      setCustomerBalances(balancesResponse.balances || [])

      toast({
        title: "Success",
        description: response.message || "Payment received successfully",
      })
    } catch (error: any) {
      console.error('Error receiving money:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to receive money",
        variant: "destructive",
      })
    }
  }

  const onCreateAccount = async (data: any) => {
    try {
      const response = await createBankAccount(data)
      
      setCreateAccountDialogOpen(false)
      resetCreateAccount()
      
      // Refresh accounts
      const accountsResponse = await getBankAccounts()
      setAccounts(accountsResponse.accounts || [])
      
      // Select the newly created account if it's the first one
      if (accountsResponse.accounts?.length === 1) {
        setSelectedAccount(accountsResponse.accounts[0]._id)
      }

      toast({
        title: "Success",
        description: response.message || "Bank account created successfully",
      })
    } catch (error: any) {
      console.error('Error creating bank account:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create bank account",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "text-xs py-1 px-2 rounded-full border"
    const statusClasses = getStatusColor(status).split(' ')
    return `${baseClasses} ${statusClasses.join(' ')}`
  }

  const getTransactionIcon = (type: string) => {
    const colorClass = getTransactionTypeColor(type)
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className={`w-4 h-4 ${colorClass}`} />
      case 'withdrawal':
        return <ArrowUpRight className={`w-4 h-4 ${colorClass}`} />
      case 'transfer':
        return <Send className={`w-4 h-4 ${colorClass}`} />
      default:
        return <DollarSign className={`w-4 h-4 ${colorClass}`} />
    }
  }

  const selectedAccountData = accounts.find(acc => acc._id === selectedAccount)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-slate-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-slate-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Banking</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your bank accounts and transactions</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={receiveMoneyDialogOpen} onOpenChange={setReceiveMoneyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Receive Money
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>Record Received Payment</DialogTitle>
                <DialogDescription>Record a payment received from a customer</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleReceiveSubmit(onReceiveMoney)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer *</Label>
                  <Select 
                    onValueChange={(value) => setReceiveValue('customerId', value)}
                    defaultValue=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl">
                      {clients.map((client) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.companyName || client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {receiveErrors.customerId && (
                    <p className="text-sm text-red-600">Please select a customer</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    {...registerReceive('amount', { 
                      required: 'Amount is required', 
                      min: { value: 0.01, message: 'Amount must be positive' },
                      valueAsNumber: true
                    })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                  {receiveErrors.amount && (
                    <p className="text-sm text-red-600">{receiveErrors.amount.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    {...registerReceive('description', { required: 'Description is required' })}
                    placeholder="Payment description"
                  />
                  {receiveErrors.description && (
                    <p className="text-sm text-red-600">{receiveErrors.description.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select 
                    onValueChange={(value) => setReceiveValue('paymentMethod', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl">
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="wire">Wire Transfer</SelectItem>
                      <SelectItem value="ach">ACH</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    {...registerReceive('reference')}
                    placeholder="Payment reference"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setReceiveMoneyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600">
                    Record Payment
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={sendMoneyDialogOpen} onOpenChange={setSendMoneyDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
                <Send className="w-4 h-4 mr-2" />
                Send Money
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>Send Money</DialogTitle>
                <DialogDescription>Send payment to a customer or supplier</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendSubmit(onSendMoney)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientType">Recipient Type *</Label>
                  <Select 
                    onValueChange={(value) => setSendValue('recipientType', value as any)}
                    defaultValue="customer"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl">
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientId">Recipient *</Label>
                  <Select 
                    onValueChange={(value) => setSendValue('recipientId', value)}
                    defaultValue=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${recipientType}`} />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl">
                      {recipientType === 'customer' ? (
                        clients.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            {client.companyName || client.name}
                          </SelectItem>
                        ))
                      ) : (
                        suppliers.map((supplier) => (
                          <SelectItem key={supplier._id} value={supplier._id}>
                            {supplier.supplierName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {sendErrors.recipientId && (
                    <p className="text-sm text-red-600">Please select a recipient</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    {...registerSend('amount', { 
                      required: 'Amount is required', 
                      min: { value: 0.01, message: 'Amount must be positive' },
                      valueAsNumber: true
                    })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                  {sendErrors.amount && (
                    <p className="text-sm text-red-600">{sendErrors.amount.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    {...registerSend('description', { required: 'Description is required' })}
                    placeholder="Payment description"
                  />
                  {sendErrors.description && (
                    <p className="text-sm text-red-600">{sendErrors.description.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select 
                    onValueChange={(value) => setSendValue('paymentMethod', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl">
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="wire">Wire Transfer</SelectItem>
                      <SelectItem value="ach">ACH</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    {...registerSend('reference')}
                    placeholder="Payment reference"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSendMoneyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">
                    Send Payment
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createAccountDialogOpen} onOpenChange={setCreateAccountDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>Create New Bank Account</DialogTitle>
                <DialogDescription>Add a new bank account to your financial records</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAccountSubmit(onCreateAccount)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    {...registerCreateAccount('accountName', { required: 'Account name is required' })}
                    placeholder="e.g. Business Checking"
                  />
                  {createAccountErrors.accountName && (
                    <p className="text-sm text-red-600">{createAccountErrors.accountName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    {...registerCreateAccount('bankName', { required: 'Bank name is required' })}
                    placeholder="e.g. Chase Bank"
                  />
                  {createAccountErrors.bankName && (
                    <p className="text-sm text-red-600">{createAccountErrors.bankName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    {...registerCreateAccount('accountNumber', { required: 'Account number is required' })}
                    placeholder="e.g. 123456789"
                  />
                  {createAccountErrors.accountNumber && (
                    <p className="text-sm text-red-600">{createAccountErrors.accountNumber.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    {...registerCreateAccount('routingNumber')}
                    placeholder="e.g. 021000021"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type *</Label>
                    <Select 
                      {...registerCreateAccount('accountType', { required: 'Account type is required' })}
                      defaultValue="checking"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl">
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="loan">Loan</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Select 
                      {...registerCreateAccount('currency', { required: 'Currency is required' })}
                      defaultValue="USD"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl">
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                        <SelectItem value="AUD">AUD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">Initial Balance</Label>
                  <Input
                    {...registerCreateAccount('balance', { 
                      valueAsNumber: true,
                      min: { value: 0, message: 'Balance cannot be negative' }
                    })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={0}
                  />
                  {createAccountErrors.balance && (
                    <p className="text-sm text-red-600">{createAccountErrors.balance.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    {...registerCreateAccount('description')}
                    placeholder="Account description (optional)"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateAccountDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">
                    Create Account
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Account Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {accounts.map((account) => (
          <Card
            key={account._id}
            className={`bg-white/80 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200 cursor-pointer ${
              selectedAccount === account._id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedAccount(account._id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{account.accountName}</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(account.balance, account.currency)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {account.bankName} • {formatAccountNumber(account.accountNumber)}
              </p>
              <Badge variant="outline" className="mt-2 text-xs capitalize">
                {account.accountType.replace('_', ' ')}
              </Badge>
            </CardContent>
          </Card>
        ))}

        {/* Add New Account Card */}
        <Dialog open={createAccountDialogOpen} onOpenChange={setCreateAccountDialogOpen}>
          <DialogTrigger asChild>
            <Card className="bg-white/50 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200 cursor-pointer hover:bg-slate-50/70">
              <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
                  <Plus className="w-8 h-8" />
                  <p className="text-sm font-medium">Add Bank Account</p>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Rest of the component remains the same */}
      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="customers">Customer Balances</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900">
                    {selectedAccountData ? `${selectedAccountData.accountName} Transactions` : 'Transactions'}
                  </CardTitle>
                  <CardDescription>Recent transactions for the selected account</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <TableRow key={transaction._id} className="hover:bg-slate-50/50">
                          <TableCell>
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTransactionIcon(transaction.transactionType)}
                              <span className="capitalize">
                                {transaction.transactionType.replace('_', ' ')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell>
                            {transaction.reference || '-'}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            transaction.transactionType === 'deposit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.transactionType === 'deposit' ? '+' : '-'}
                            {formatCurrency(transaction.amount, selectedAccountData?.currency || 'USD')}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transaction.balance, selectedAccountData?.currency || 'USD')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(transaction.status)}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          No transactions found for this account
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Customer Balances
              </CardTitle>
              <CardDescription>Outstanding balances and payment history for customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Total Invoiced</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                      <TableHead className="text-right">Outstanding Balance</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead className="text-right">Last Payment Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerBalances.length > 0 ? (
                      customerBalances.map((balance) => (
                        <TableRow key={balance._id} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-slate-500" />
                              <span className="font-medium">{balance.customerName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(balance.totalInvoiced, 'USD')}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(balance.totalPaid, 'USD')}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            balance.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(balance.outstandingBalance, 'USD')}
                          </TableCell>
                          <TableCell>
                            {balance.lastPaymentDate ? 
                              new Date(balance.lastPaymentDate).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {balance.lastPaymentAmount ? 
                              formatCurrency(balance.lastPaymentAmount, 'USD') : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          No customer balances found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center">
                <Factory className="w-5 h-5 mr-2 text-green-600" />
                Supplier Balances
              </CardTitle>
              <CardDescription>Outstanding balances and payment history for suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Total Invoiced</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                      <TableHead className="text-right">Outstanding Balance</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead className="text-right">Last Payment Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierBalances.length > 0 ? (
                      supplierBalances.map((balance) => (
                        <TableRow key={balance._id} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Factory className="w-4 h-4 text-slate-500" />
                              <span className="font-medium">{balance.supplierName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(balance.totalInvoiced, 'USD')}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(balance.totalPaid, 'USD')}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            balance.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(balance.outstandingBalance, 'USD')}
                          </TableCell>
                          <TableCell>
                            {balance.lastPaymentDate ? 
                              new Date(balance.lastPaymentDate).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {balance.lastPaymentAmount ? 
                              formatCurrency(balance.lastPaymentAmount, 'USD') : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          No supplier balances found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}