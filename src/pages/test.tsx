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
import { getSupplierById, getSupplierTransactions } from '@/api/suppliers'
import { useToast } from '@/hooks/useToast'

interface ITransaction {
  _id: string,
  transactionDate: string,
  transactionType: string,
  description: string,
  reference?: string,
  amount: number,
  status: string
}

interface ISupplier {
  supplierName: string,
  Balance: number,
  PurchaseBalance: number
}

export function SupplierDetail() {
  const { id } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [deleting, setDeleting] = useState(false)
  const [supplierdata, setSupplierData] = useState<ISupplier | null>(null)
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        const supplierRes = await getSupplierById(id);
        if (supplierRes.success) {
          setSupplierData(supplierRes.supplier);
        }

        const txRes = await getSupplierTransactions(id);
        if (txRes.success) {
          setTransactions(txRes.transactions);
        }

      } catch (error) {
        console.error('Error fetching supplier or transactions:', error);
        toast({
          title: "Error",
          description: "Failed to load supplier data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, toast]);

  const handleDeleteSupplier = async () => {
    setDeleting(true)
    try {
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
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    }
    return variants[status] || 'bg-gray-100 text-gray-800'
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingDown className="w-4 h-4 text-green-600" />
      case 'withdrawal':
        return <TrendingUp className="w-4 h-4 text-red-600" />
      case 'transfer':
        return <CreditCard className="w-4 h-4 text-blue-600" />
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

  if (loading) return <p>Loading...</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/suppliers')} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{supplierdata?.supplierName}</h1>
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{supplierdata?.supplierName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSupplier}>
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Transactions */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions ({filteredTransactions.length})</TabsTrigger>
        </TabsList>
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
                        <TableCell className={`text-right font-medium ${tx.transactionType === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
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
