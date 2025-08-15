import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from "@/hooks/useToast"
import { useNavigate, useParams } from "react-router-dom"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ArrowLeft, CalendarIcon, FileText, Save, Edit, X, Check } from "lucide-react"

// API functions
import { createInvoice, CreateInvoiceData, InvoiceItem } from "@/api/invoices"
import { getPurchaseOrdersByOrderId, PurchaseOrder } from "@/api/purchaseOrders"
import { getOrderById, Order, updateOrder } from '@/api/orders'
import { getClientById, updateClient } from '@/api/clients'

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ImagePlaceholder } from "@/components/ImagePlaceholder"

export function CreateInvoice() {
  const { id: orderId } = useParams<{ id: string }>()
  const { toast } = useToast()
  const navigate = useNavigate()
  
  // State management
  const [order, setOrder] = useState<Order | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({})
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date())
  const [dueDate, setDueDate] = useState<Date>()
  const [loading, setLoading] = useState(false)
  const [clientData, setClientData] = useState<any>()
  const [editingCommission, setEditingCommission] = useState(false)
  const [tempCommissionRate, setTempCommissionRate] = useState(0)

  // Form handling
  const { register, handleSubmit, setValue, watch } = useForm<CreateInvoiceData>({
    defaultValues: {
      paymentTerms: 'Net 30'
    }
  })

  // Fetch order data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderResponse = await getOrderById(orderId);
        if (!orderResponse.data) {
          throw new Error('Order data not found');
        }
        setOrder(orderResponse.data);
        setTempCommissionRate(orderResponse.data.order.commissionRate)
        
        const poResponse = await getPurchaseOrdersByOrderId(orderId);
        if (!poResponse.purchaseOrder?.data?.purchaseOrders) {
          throw new Error('Purchase orders not found');
        }
        setPurchaseOrders(poResponse.purchaseOrder.data.purchaseOrders);
        
        const clientId = orderResponse.data.order.clientId._id
        const clientResponse = await getClientById(clientId);
        setClientData(clientResponse.client)
        
      } catch (error) {
        toast({
          title: "Loading Error",
          description: error.message,
          variant: "destructive"
        });
        navigate('/orders');
      }
    };
    
    if (orderId) fetchData();
  }, [orderId]);

  // Handle commission rate update
  const handleUpdateCommissionRate = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      await updateOrder(orderId, { commissionRate: tempCommissionRate });
      
      // Update local state
      if (order) {
        setOrder({
          ...order,
          order: {
            ...order.order,
            commissionRate: tempCommissionRate
          }
        });
      }
      
      toast({
        title: "Success",
        description: "Commission rate updated successfully",
      });
      
      setEditingCommission(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update commission rate",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Item selection handlers
  const handleItemSelection = (key: string, checked: boolean) => {
    setSelectedItems(prev => ({ ...prev, [key]: checked }))
  }

  const handleQuantityChange = (key: string, quantity: number) => {
    setItemQuantities(prev => ({ ...prev, [key]: quantity }))
  }

  const handlePriceChange = (key: string, price: number) => {
    setItemPrices(prev => ({ ...prev, [key]: price }))
  }

  // Get selected items for invoice
  const getSelectedInvoiceItems = (): InvoiceItem[] => {
    const items: InvoiceItem[] = []
    
    purchaseOrders.forEach(po => {
      po.items?.forEach(item => {
        if (selectedItems[item._id || '']) {
          const quantity = itemQuantities[item._id || ''] || item.quantity
          const unitPrice = itemPrices[item._id || ''] || item.unitPrice
          
          items.push({
            ...item,
            quantity,
            unitPrice,
            total: quantity * unitPrice
          })
        }
      })
    })
    
    return items
  }

  // Calculate invoice totals
  const calculateTotals = () => {
    const items = getSelectedInvoiceItems()
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const commissionRate = order?.order.commissionRate || 5
    const commissionFee = subtotal * (commissionRate / 100)
    const total = subtotal + commissionFee
    
    return { subtotal, commissionFee, total, commissionRate }
  }

  // Form submission
  const onSubmit = async (data: CreateInvoiceData) => {
    if (!orderId || purchaseOrders.length === 0) return;

    const selectedInvoiceItems = getSelectedInvoiceItems();
    
    if (selectedInvoiceItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item for the invoice",
        variant: "destructive",
      });
      return;
    }

    if (!dueDate) {
      toast({
        title: "Error",
        description: "Please select a due date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const invoiceData: CreateInvoiceData = {
        purchaseId: purchaseOrders[0]._id,
        orderId,
        dueDate: dueDate.toISOString(),
        paymentTerms: data.paymentTerms,
        items: selectedInvoiceItems,
        commissionRate: order?.order.commissionRate || 5
      };

      // Create the invoice
      const invoiceResponse = await createInvoice(invoiceData);
      
      // Update client's TotalInvoice and InvoiceBalance
      const { total } = calculateTotals();
      const totalInvoiceBalance = total + (clientData?.InvoiceBalance || 0)
      if (clientData) {
        await updateClient(clientData._id, { 
          InvoiceBalance: totalInvoiceBalance
        });
      }

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      navigate(`/orders/${orderId}`);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (!order || purchaseOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg text-gray-600">Loading order and purchase orders data...</p>
      </div>
    )
  }

  const { subtotal, commissionFee, total, commissionRate } = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Generate Sales Invoice</h1>
          <p className="text-slate-600 dark:text-slate-400">Order #{orderId}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Order Information */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
          <CardHeader>
            <CardTitle className="text-slate-900">Order Information</CardTitle>
            <CardDescription>Basic information for this sales invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Order Item</Label>
                <Input 
                  value={`OR#${String(order?.order.orderItem).padStart(3, '0')}`} 
                  disabled 
                  className="bg-slate-50" 
                />
              </div>
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input 
                  value={order?.order.clientName} 
                  disabled 
                  className="bg-slate-50" 
                />
              </div>
              <div className="space-y-2">
                <Label>Commission Rate</Label>
                <div className="flex items-center gap-2">
                  {editingCommission ? (
                    <>
                      <Input
                        type="number"
                        value={tempCommissionRate}
                        onChange={(e) => setTempCommissionRate(Number(e.target.value))}
                        className="w-20"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingCommission(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleUpdateCommissionRate}
                        disabled={loading}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input 
                        value={`${commissionRate}%`} 
                        disabled 
                        className="bg-slate-50 w-20" 
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingCommission(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items from Purchase Orders */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
          <CardHeader>
            <CardTitle className="text-slate-900">Items from Purchase Orders</CardTitle>
            <CardDescription>Select and modify items to include in the sales invoice</CardDescription>
          </CardHeader>
          <CardContent>
            {purchaseOrders.some(po => po.items && po.items.length > 0) ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead className="w-20">Photo</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="w-32">Cost</TableHead>
                      <TableHead className="w-32">Sell Price</TableHead>
                      <TableHead className="w-32">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map(po => (
                      po.items?.map(item => {
                        const key = item._id || Math.random().toString()
                        const quantity = itemQuantities[key] || item.quantity
                        const sellPrice = itemPrices[key] || item.unitPrice
                        const itemTotal = quantity * sellPrice
                        
                        return (
                          <TableRow key={key}>
                            <TableCell>
                              <Checkbox
                                checked={selectedItems[key] || false}
                                onCheckedChange={(checked) => handleItemSelection(key, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>
                              <ImagePlaceholder
                                src={item.photo}
                                alt="Product"
                                className="w-16 h-16 rounded"
                                fallbackText="Product"
                              />
                            </TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => handleQuantityChange(key, parseInt(e.target.value) || 0)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={sellPrice}
                                onChange={(e) => handlePriceChange(key, parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>${itemTotal.toFixed(2)}</TableCell>
                          </TableRow>
                        )
                      })
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No items found in the purchase orders.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
          <CardHeader>
            <CardTitle className="text-slate-900">Invoice Details</CardTitle>
            <CardDescription>Set invoice dates and payment terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !invoiceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {invoiceDate ? format(invoiceDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-xl">
                    <Calendar
                      mode="single"
                      selected={invoiceDate}
                      onSelect={setInvoiceDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-xl">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select 
                  onValueChange={(value) => setValue('paymentTerms', value)} 
                  value={watch('paymentTerms')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl">
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Commission Fee ({commissionRate}%):</span>
                    <span className="font-medium">${commissionFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || getSelectedInvoiceItems().length === 0}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Invoice'}
          </Button>
        </div>
      </form>
    </div>
  )
}