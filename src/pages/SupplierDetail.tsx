import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Factory,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  ShoppingCart,
  Truck,
  Eye,
  Calendar,
  CreditCard,
  Receipt,
  Search,
  Trash2,
  Package,
  List
} from "lucide-react"
import { getSupplierById, getSupplierTransactions, getSupplierPurchases } from '@/api/suppliers'
import { useToast } from '@/hooks/useToast'

interface ISupplier {
  supplierName: string
  Balance: number
  PurchaseBalance: number
  purchaseOrders?: string[]
}

interface ITransaction {
  _id: string
  transactionDate: string
  transactionType: string
  description: string
  reference?: string
  amount: number
  status: string
}

interface IPurchaseItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
  photo?: string
}

interface IPurchaseOrder {
  _id: string
  orderId: {
    _id: string
    projectName?: string
    clientName?: string
  }
  supplierId: string
  supplierName: string
  items: IPurchaseItem[]
  paymentTerms: string
  deliveryDate: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  payments: {
    paymentType: string
    amount: number
    paymentDate: string
    paymentMethod: string
    status: string
  }[]
  status: 'draft' | 'sent' | 'confirmed' | 'received'
  createdAt: string
  updatedAt: string
}

export function SupplierDetail() {
  const { id } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [deleting, setDeleting] = useState(false)
  const [supplierdata, setSupplierData] = useState<ISupplier>({
    supplierName: '',
    Balance: 0,
    PurchaseBalance: 0
  })
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [purchases, setPurchases] = useState<IPurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        setLoading(true)
        
        // Fetch supplier basic info
        const supplierRes = await getSupplierById(id)
        if (!supplierRes.success) throw new Error("Failed to fetch supplier data")
        setSupplierData(supplierRes.supplier)

        // Fetch transactions
        const txRes = await getSupplierTransactions(id)
        if (txRes.success) setTransactions(txRes.transactions)

        // Fetch purchases
        const purchasesRes = await getSupplierPurchases(id)
        if (purchasesRes.success) setPurchases(purchasesRes.purchases)

      } catch (error) {
        console.error('Error fetching supplier data:', error)
        toast({
          title: "Error",
          description: "Failed to load supplier data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchSupplierData()
  }, [id, toast])

  const handleDeleteSupplier = async () => {
    setDeleting(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Supplier deleted successfully')
      navigate('/suppliers')
    } catch (error) {
      console.error('Error deleting supplier:', error)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      received: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      sent: 'bg-blue-100 text-blue-800 border-blue-200',
      in_transit: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200'
    }
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase_order':
        return <ShoppingCart className="w-4 h-4 text-blue-600" />
      case 'payment':
        return <CreditCard className="w-4 h-4 text-green-600" />
      case 'credit':
        return <TrendingDown className="w-4 h-4 text-green-600" />
      case 'debit':
        return <TrendingUp className="w-4 h-4 text-red-600" />
      default:
        return <Receipt className="w-4 h-4 text-slate-600" />
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || transaction.transactionType === filterType
    return matchesSearch && matchesType
  })

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.orderId?.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.items.some(item => 
                           item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const outstandingBalance = supplierdata.PurchaseBalance - supplierdata.Balance

  if (loading) return <div className="flex justify-center items-center h-64">Loading supplier data...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/suppliers')} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{supplierdata.supplierName}</h1>
            <p className="text-slate-600 dark:text-slate-400">Supplier Statement & Account Overview</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white/95 backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{supplierdata.supplierName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSupplier}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Supplier Info Card */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Factory className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-slate-900">{supplierdata.supplierName}</CardTitle>
              <CardDescription className="text-lg">Supplier Account</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Purchased</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">${supplierdata.PurchaseBalance.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${supplierdata.Balance.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Payments made</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Outstanding Balance</CardTitle>
            <DollarSign className={`h-4 w-4 ${outstandingBalance > 0 ? 'text-red-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${Math.abs(outstandingBalance).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {outstandingBalance > 0 ? 'Amount owed' : 'Credit balance'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Purchase Orders</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {purchases.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search transactions, purchases, or items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Purchases ({filteredPurchases.length})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Receipt className="w-4 h-4 mr-2" />
            Transactions ({filteredTransactions.length})
          </TabsTrigger>
        </TabsList>

        {/* Purchases Tab */}
        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Purchase Orders</CardTitle>
              <CardDescription>All purchase orders from this supplier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase) => (
                      <TableRow key={purchase._id}>
                        <TableCell className="font-medium">PO-{String(purchase.PurchaseItem).padStart(3, '0')}</TableCell>
                        <TableCell>
                          {purchase.orderId?.projectName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <List className="w-4 h-4 mr-1" />
                            {purchase.items.length} items
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(purchase.deliveryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${purchase.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(purchase.status)}>
                            {purchase.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/purchase-orders/${purchase._id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Transaction History</CardTitle>
              <CardDescription>All financial transactions with this supplier</CardDescription>
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
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell>{new Date(tx.transactionDate).toLocaleDateString()}</TableCell>
                        <TableCell className="flex items-center space-x-2">
                          {getTransactionIcon(tx.transactionType)}
                          <span>{tx.transactionType}</span>
                        </TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell>{tx.reference || '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${tx.transactionType === 'payment' ? 'text-green-600' : 'text-red-600'}`}>
                          ${tx.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(tx.status)}>{tx.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
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