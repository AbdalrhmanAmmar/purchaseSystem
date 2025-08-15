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
  Trash2
} from "lucide-react"
import { getSupplierById } from '@/api/suppliers'
import { useToast } from '@/hooks/useToast'

// Static data
const staticSupplierData = {
  supplier: {
    supplierName: "Tech Supplies Inc.",
    Balance: 1500,
    PurchaseBalance: 8500,
    _id: "689be3242c5eee8345643315",
    createdAt: "2025-08-13T00:58:12.065Z",
    updatedAt: "2025-08-15T10:22:45.120Z"
  },
  totalPurchased: 12500,
  totalPaid: 11000,
  outstandingBalance: 1500,
  transactions: [
    {
      _id: "1",
      date: "2025-08-10T09:15:00.000Z",
      type: "purchase_order",
      description: "Laptop order - 50 units",
      reference: "PO-2025-0810",
      amount: 5000,
      status: "completed"
    },
    {
      _id: "2",
      date: "2025-08-12T14:30:00.000Z",
      type: "payment",
      description: "Payment for invoice #INV-2025-0810",
      reference: "PAY-2025-0812",
      amount: -3000,
      status: "confirmed"
    },
    {
      _id: "3",
      date: "2025-08-14T11:45:00.000Z",
      type: "purchase_order",
      description: "Monitor order - 30 units",
      reference: "PO-2025-0814",
      amount: 3500,
      status: "pending"
    }
  ],
  purchaseOrders: [
    {
      _id: "PO-2025-0810",
      orderId: "PO-2025-0810",
      projectName: "Office Equipment Upgrade",
      status: "completed",
      totalAmount: 5000,
      paymentTerms: "Net 30",
      deliveryDate: "2025-08-18T00:00:00.000Z"
    },
    {
      _id: "PO-2025-0814",
      orderId: "PO-2025-0814",
      projectName: "Conference Room Setup",
      status: "pending",
      totalAmount: 3500,
      paymentTerms: "Net 15",
      deliveryDate: "2025-08-20T00:00:00.000Z"
    }
  ],
  shipments: [
    {
      _id: "SH-2025-0810",
      orderId: "PO-2025-0810",
      trackingNumber: "TRK123456789",
      shippingCompany: "Fast Delivery Inc.",
      status: "delivered",
      expectedDelivery: "2025-08-18T00:00:00.000Z",
      totalCost: 250
    },
    {
      _id: "SH-2025-0814",
      orderId: "PO-2025-0814",
      trackingNumber: "TRK987654321",
      shippingCompany: "Quick Ship LLC",
      status: "in_transit",
      expectedDelivery: "2025-08-20T00:00:00.000Z",
      totalCost: 180
    }
  ]
}

interface ISupplier{
  supplierName:string,
  Balance:number,
  PurchaseBalance:number
}

export function SupplierDetail() {
  const {id} = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [deleting, setDeleting] = useState(false)
  const [supplierdata, setsupplierdata] = useState<ISupplier>({});
const [loading, setLoading] = useState(true);
const { toast } = useToast();
  const navigate = useNavigate()

  // Use static data instead of API call
  const statement = staticSupplierData

useEffect(() => {
  const fetchSupplier = async () => {
    try {
      const response = await getSupplierById(id);
      console.log('API Response:', response);
      
      if (response.success) {
        setsupplierdata(response.supplier);
      } else {
        throw new Error("Failed to fetch supplier data");
      }
    } catch (error) {
      console.error('Error fetching supplier:', error);
      toast({
        title: "Error",
        description: "Failed to load supplier data",
        variant: "destructive",
      });
    }
  };

  if (id) {
    fetchSupplier();
  }
}, [id, toast]);
  

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

  const filteredTransactions = statement.transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || transaction.type === filterType
    return matchesSearch && matchesType
  })

  const filteredPurchaseOrders = statement.purchaseOrders.filter(po => {
    const matchesSearch = po.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po._id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredShipments = statement.shipments.filter(shipment => {
    const matchesSearch = shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.shippingCompany.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
            <div className="text-2xl font-bold text-slate-900">${supplierdata.PurchaseBalance}</div>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${supplierdata.Balance}</div>
            <p className="text-xs text-slate-500 mt-1">Payments made</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Outstanding Balance</CardTitle>
            <DollarSign className={`h-4 w-4 ${statement.outstandingBalance > 0 ? 'text-red-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statement.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${Math.abs(supplierdata.PurchaseBalance - supplierdata.Balance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {statement.outstandingBalance > 0 ? 'Amount owed' : 'Credit balance'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Orders</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {statement.purchaseOrders.filter(po => po.status !== 'received' && po.status !== 'cancelled').length}
            </div>
            <p className="text-xs text-slate-500 mt-1">In progress</p>
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
                placeholder="Search transactions, orders, or shipments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions ({filteredTransactions.length})</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders ({filteredPurchaseOrders.length})</TabsTrigger>
          <TabsTrigger value="shipments">Shipments ({filteredShipments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
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
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction._id} className="hover:bg-slate-50/50">
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTransactionIcon(transaction.type)}
                            <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                        <TableCell>{transaction.reference || '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${
                          transaction.amount > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(transaction.status)}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-slate-900">Purchase Orders</CardTitle>
              <CardDescription>All purchase orders placed with this supplier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO ID</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>Payment Terms</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchaseOrders.map((order) => (
                      <TableRow key={order._id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">#{order._id}</TableCell>
                        <TableCell>{order.projectName}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(order.status)}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${order.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>{order.paymentTerms}</TableCell>
                        <TableCell>{new Date(order.deliveryDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/orders/${order.orderId}`)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
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

        <TabsContent value="shipments" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="text-slate-900">Shipments</CardTitle>
              <CardDescription>All shipments from this supplier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipment ID</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Shipping Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map((shipment) => (
                      <TableRow key={shipment._id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">#{shipment._id}</TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600 hover:text-blue-700"
                            onClick={() => navigate(`/orders/${shipment.orderId}`)}
                          >
                            #{shipment.orderId}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{shipment.trackingNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Truck className="w-4 h-4 text-slate-500" />
                            <span>{shipment.shippingCompany}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(shipment.status)}>
                            {shipment.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span>{new Date(shipment.expectedDelivery).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${shipment.totalCost.toLocaleString()}
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