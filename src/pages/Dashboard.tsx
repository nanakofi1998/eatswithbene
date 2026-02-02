// pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  TrendingUp,
  Truck,
  Calendar,
  CreditCard,
  CheckCircle2,
  DollarSign,
  ShoppingBag,
  Home,
  Edit,
  Trash2,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface OrderData {
  id: string;
  created_at: string;
  customer_name: string;
  food_type: string;
  number_of_packs: number;
  order_type: string;
  delivery_method: "pickup" | "delivery";
  delivery_address?: string;
  pickup_location?: string;
  subtotal: number;
  rush_fee: number;
  delivery_fee: number;
  total_amount: number;
  order_status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  payment_status: "awaiting_confirmation" | "paid" | "failed";
  tracking_token: string;
  notes?: string;
}

interface SlotData {
  id: string;
  date: string;
  total_slots: number;
  available_slots: number;
  is_active: boolean;
  created_at: string;
}

interface AnalyticsData {
  pickupCount: number;
  deliveryCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  topFoodItems: { name: string; count: number; revenue: number }[];
  revenueByDay: { day: string; revenue: number; orders: number }[];
}

const foodTypeLabels: Record<string, string> = {
  "fried-rice": "Check Check Fried Rice",
  "noodles-chicken": "Super Loaded Noodles (With Chicken)",
  "noodles-no-chicken": "Super Loaded Noodles (No Chicken)",
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Dashboard = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    pickupCount: 0,
    deliveryCount: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    topFoodItems: [],
    revenueByDay: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>("week");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Slots modal state
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [slotForm, setSlotForm] = useState({
    date: "",
    totalSlots: "",
    isActive: true,
  });

  // Action modal state
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [actionType, setActionType] = useState<"confirmPayment" | "markDelivered" | "cancelOrder" | null>(null);

  // Filter orders by date range
  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return {
          start: format(now, 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd'),
        };
      case "week":
        return {
          start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        };
      case "month":
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: format(firstDay, 'yyyy-MM-dd'),
          end: format(lastDay, 'yyyy-MM-dd'),
        };
      case "custom":
        return {
          start: customStartDate,
          end: customEndDate,
        };
      default:
        return {
          start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        };
    }
  };

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    try {
      const { start, end } = getDateRangeFilter();

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateRange !== 'all') {
        query = query
          .gte('created_at', `${start}T00:00:00`)
          .lte('created_at', `${end}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
      calculateAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch slots from Supabase
  const fetchSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .order('date', { ascending: true })
        .gte('date', format(new Date(), 'yyyy-MM-dd'));

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({
        title: "Error",
        description: "Failed to load slots",
        variant: "destructive",
      });
    }
  };

  // Calculate analytics from orders
  const calculateAnalytics = (orderData: OrderData[]) => {
    const pickupCount = orderData.filter(o => o.delivery_method === 'pickup').length;
    const deliveryCount = orderData.filter(o => o.delivery_method === 'delivery').length;
    const totalRevenue = orderData.reduce((sum, o) => sum + o.total_amount, 0);
    const avgOrderValue = orderData.length > 0 ? totalRevenue / orderData.length : 0;

    // Calculate top food items
    const foodStats = orderData.reduce((acc, order) => {
      const foodName = foodTypeLabels[order.food_type] || order.food_type;
      if (!acc[foodName]) {
        acc[foodName] = { count: 0, revenue: 0 };
      }
      acc[foodName].count += order.number_of_packs;
      acc[foodName].revenue += order.total_amount;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    const topFoodItems = Object.entries(foodStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate revenue by day
    const revenueByDay = orderData.reduce((acc, order) => {
      const day = format(parseISO(order.created_at), 'EEE');
      const existingDay = acc.find(d => d.day === day);
      if (existingDay) {
        existingDay.revenue += order.total_amount;
        existingDay.orders += 1;
      } else {
        acc.push({ day, revenue: order.total_amount, orders: 1 });
      }
      return acc;
    }, [] as { day: string; revenue: number; orders: number }[]);

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const completeRevenueByDay = daysOfWeek.map(day => {
      const existing = revenueByDay.find(d => d.day === day);
      return existing || { day, revenue: 0, orders: 0 };
    });

    setAnalytics({
      pickupCount,
      deliveryCount,
      totalRevenue,
      avgOrderValue,
      topFoodItems,
      revenueByDay: completeRevenueByDay,
    });
  };

  // Initialize
  useEffect(() => {
    fetchOrders();
    fetchSlots();
  }, [dateRange, customStartDate, customEndDate]);

  // Handle order actions
  const handleOrderAction = async () => {
    if (!selectedOrder || !actionType) return;

    try {
      let updates: any = {};
      let message = "";

      switch (actionType) {
        case "confirmPayment":
          updates.payment_status = "paid";
          updates.order_status = "preparing";
          message = "Payment confirmed and order moved to preparation";
          break;

        case "markDelivered":
          updates.order_status = "delivered";
          message = "Order marked as delivered";
          break;

        case "cancelOrder":
          updates.order_status = "cancelled";
          message = "Order cancelled";
          break;
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: message,
      });

      await fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  // Handle slot creation/update
  const handleSlotSubmit = async () => {
    try {
      if (selectedSlot) {
        const { error } = await supabase
          .from('slots')
          .update({
            total_slots: parseInt(slotForm.totalSlots),
            available_slots: parseInt(slotForm.totalSlots),
            is_active: slotForm.isActive,
          })
          .eq('id', selectedSlot.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Slot updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('slots')
          .insert({
            date: slotForm.date,
            total_slots: parseInt(slotForm.totalSlots),
            available_slots: parseInt(slotForm.totalSlots),
            is_active: slotForm.isActive,
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Slot created successfully",
        });
      }

      fetchSlots();
      setIsSlotModalOpen(false);
      setSelectedSlot(null);
      setSlotForm({ date: "", totalSlots: "", isActive: true });
    } catch (error) {
      console.error('Error saving slot:', error);
      toast({
        title: "Error",
        description: "Failed to save slot",
        variant: "destructive",
      });
    }
  };

  // Handle slot deletion
  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Slot deleted successfully",
      });

      fetchSlots();
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast({
        title: "Error",
        description: "Failed to delete slot",
        variant: "destructive",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment badge color
  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'awaiting_confirmation': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <Navbar />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage orders, view analytics, and configure available slots
            </p>
          </div>

          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="slots">Slots</TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Date Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label>Date Range</Label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger>
                          <Calendar className="mr-2 h-4 w-4" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {dateRange === 'custom' && (
                      <>
                        <div className="flex-1">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            min={customStartDate}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(analytics.totalRevenue)}</p>
                      </div>
                      <div className="p-3 rounded-full bg-primary/10">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                        <p className="text-3xl font-bold mt-1">{orders.length}</p>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100">
                        <ShoppingBag className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pickup vs Delivery</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-semibold">{analytics.pickupCount}</span>
                          <span className="text-muted-foreground">|</span>
                          <span className="text-lg font-semibold">{analytics.deliveryCount}</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-full bg-green-100">
                        <Truck className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(analytics.avgOrderValue)}</p>
                      </div>
                      <div className="p-3 rounded-full bg-purple-100">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Day */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Day</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.revenueByDay}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8884d8"
                            strokeWidth={2}
                            name="Revenue"
                          />
                          <Line
                            type="monotone"
                            dataKey="orders"
                            stroke="#82ca9d"
                            strokeWidth={2}
                            name="Orders"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Food Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Food Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.topFoodItems}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis />
                          <Tooltip formatter={(value, name) => {
                            if (name === 'revenue') return [formatCurrency(value as number), 'Revenue'];
                            if (name === 'count') return [value, 'Packs Sold'];
                            return [value, name];
                          }} />
                          <Legend />
                          <Bar dataKey="count" name="Packs Sold" fill="#8884d8" />
                          <Bar dataKey="revenue" name="Revenue" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Pickup vs Delivery */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Delivery Method Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Pickup', value: analytics.pickupCount },
                                { name: 'Delivery', value: analytics.deliveryCount },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => `${entry.name}: ${entry.value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill="#0088FE" />
                              <Cell fill="#00C49F" />
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100">
                              <Home className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">Pickup Orders</p>
                              <p className="text-2xl font-bold">{analytics.pickupCount}</p>
                            </div>
                          </div>
                          <p className="text-sm text-blue-600">
                            {orders.length > 0 ? `${((analytics.pickupCount / orders.length) * 100).toFixed(1)}%` : '0%'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-green-100">
                              <Truck className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">Delivery Orders</p>
                              <p className="text-2xl font-bold">{analytics.deliveryCount}</p>
                            </div>
                          </div>
                          <p className="text-sm text-green-600">
                            {orders.length > 0 ? `${((analytics.deliveryCount / orders.length) * 100).toFixed(1)}%` : '0%'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>
                      Orders from {getDateRangeFilter().start} to {getDateRangeFilter().end}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchOrders}>
                    <Filter className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Food</TableHead>
                          <TableHead>Packs</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-10">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span className="ml-2">Loading orders...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : orders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p>No orders found for the selected period</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                {format(parseISO(order.created_at), 'MMM dd, HH:mm')}
                              </TableCell>
                              <TableCell className="font-medium">{order.customer_name}</TableCell>
                              <TableCell>{foodTypeLabels[order.food_type] || order.food_type}</TableCell>
                              <TableCell>{order.number_of_packs}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {order.order_type === 'pre-order' ? 'Pre-order' : 'Same Day'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getPaymentColor(order.payment_status)}>
                                  {order.payment_status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(order.order_status)}>
                                  {order.order_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {/* Confirm Payment Button */}
                                  {order.payment_status === 'awaiting_confirmation' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setActionType("confirmPayment");
                                      }}
                                    >
                                      <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                      Confirm Payment
                                    </Button>
                                  )}

                                  {/* Mark as Delivered Button */}
                                  {order.order_status === 'ready' && order.payment_status === 'paid' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setActionType("markDelivered");
                                      }}
                                    >
                                      <Truck className="mr-1.5 h-3.5 w-3.5" />
                                      Mark Delivered
                                    </Button>
                                  )}

                                  {/* Cancel Order Button */}
                                  {['pending', 'preparing'].includes(order.order_status) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setActionType("cancelOrder");
                                      }}
                                    >
                                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Slots Tab */}
            <TabsContent value="slots" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Available Slots</CardTitle>
                    <CardDescription>
                      Manage daily order slots and availability
                    </CardDescription>
                  </div>
                  <Dialog open={isSlotModalOpen} onOpenChange={setIsSlotModalOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setSelectedSlot(null);
                        setSlotForm({ date: "", totalSlots: "", isActive: true });
                      }}>
                        + Add Slot
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {selectedSlot ? 'Edit Slot' : 'Add New Slot'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={slotForm.date}
                            onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slots">Total Slots</Label>
                          <Input
                            id="slots"
                            type="number"
                            min="1"
                            placeholder="Enter total slots"
                            value={slotForm.totalSlots}
                            onChange={(e) => setSlotForm({ ...slotForm, totalSlots: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="active"
                            checked={slotForm.isActive}
                            onChange={(e) => setSlotForm({ ...slotForm, isActive: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="active">Active</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSlotModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSlotSubmit}>
                          {selectedSlot ? 'Update' : 'Create'} Slot
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {slots.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No slots configured yet</p>
                      <p className="text-sm mt-2">Add slots to manage daily order limits</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {slots.map((slot) => (
                        <Card key={slot.id} className={!slot.is_active ? 'opacity-60' : ''}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="text-lg font-semibold">
                                  {format(parseISO(slot.date), 'MMM dd, yyyy')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(parseISO(slot.date), 'EEEE')}
                                </p>
                              </div>
                              <Badge variant={slot.is_active ? 'default' : 'secondary'}>
                                {slot.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Total Slots:</span>
                                <span className="font-medium">{slot.total_slots}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Available:</span>
                                <span className="font-medium">{slot.available_slots}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Booked:</span>
                                <span className="font-medium">
                                  {slot.total_slots - slot.available_slots}
                                </span>
                              </div>
                            </div>

                            <div className="mt-6 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setSlotForm({
                                    date: slot.date,
                                    totalSlots: slot.total_slots.toString(),
                                    isActive: slot.is_active,
                                  });
                                  setIsSlotModalOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSlot(slot.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* MODALS - PLACED OUTSIDE THE TABS COMPONENT */}
          
          {/* Confirm Payment Modal */}
          <Dialog
            open={actionType === "confirmPayment" && !!selectedOrder}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedOrder(null);
                setActionType(null);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Payment Received</DialogTitle>
                <DialogDescription>
                  Are you sure you want to mark this payment as received?
                </DialogDescription>
              </DialogHeader>

              {selectedOrder && (
                <div className="space-y-4 py-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Order ID:</p>
                        <p className="text-muted-foreground">{selectedOrder.id.slice(-8)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Customer:</p>
                        <p className="text-muted-foreground">{selectedOrder.customer_name}</p>
                      </div>
                      <div>
                        <p className="font-medium">Amount:</p>
                        <p className="text-muted-foreground">{formatCurrency(selectedOrder.total_amount)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Payment Method:</p>
                        <p className="text-muted-foreground">e-Transfer</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-notes">Payment Notes (Optional)</Label>
                    <Input
                      id="payment-notes"
                      placeholder="e.g., Reference number, confirmation details"
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOrder(null);
                    setActionType(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await handleOrderAction();
                    setSelectedOrder(null);
                    setActionType(null);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Payment Received
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Mark as Delivered Modal */}
          <Dialog
            open={actionType === "markDelivered" && !!selectedOrder}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedOrder(null);
                setActionType(null);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark Order as Delivered</DialogTitle>
                <DialogDescription>
                  Confirm that this order has been delivered to the customer.
                </DialogDescription>
              </DialogHeader>

              {selectedOrder && (
                <div className="space-y-4 py-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Order ID:</p>
                        <p className="text-muted-foreground">{selectedOrder.id.slice(-8)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Customer:</p>
                        <p className="text-muted-foreground">{selectedOrder.customer_name}</p>
                      </div>
                      {selectedOrder.delivery_address && (
                        <div className="col-span-2">
                          <p className="font-medium">Delivery Address:</p>
                          <p className="text-muted-foreground">{selectedOrder.delivery_address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery-notes">Delivery Notes (Optional)</Label>
                    <Input
                      id="delivery-notes"
                      placeholder="e.g., Delivered to reception, left at door"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="customer-confirmed"
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="customer-confirmed" className="text-sm">
                      Customer confirmed receipt
                    </Label>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOrder(null);
                    setActionType(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await handleOrderAction();
                    setSelectedOrder(null);
                    setActionType(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Mark as Delivered
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cancel Order Modal */}
          <Dialog
            open={actionType === "cancelOrder" && !!selectedOrder}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedOrder(null);
                setActionType(null);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Order</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. The customer will be notified.
                </DialogDescription>
              </DialogHeader>

              {selectedOrder && (
                <div className="space-y-4 py-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Order ID:</p>
                        <p className="text-muted-foreground">{selectedOrder.id.slice(-8)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Amount:</p>
                        <p className="text-muted-foreground">{formatCurrency(selectedOrder.total_amount)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-medium">Food:</p>
                        <p className="text-muted-foreground">{foodTypeLabels[selectedOrder.food_type] || selectedOrder.food_type}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancel-reason">Reason for Cancellation (Required)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        <SelectItem value="customer_request">Customer Request</SelectItem>
                        <SelectItem value="unavailable_ingredients">Unavailable Ingredients</SelectItem>
                        <SelectItem value="kitchen_issues">Kitchen Issues</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancel-notes">Additional Notes</Label>
                    <Input
                      id="cancel-notes"
                      placeholder="Provide more details about the cancellation"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="refund-required"
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="refund-required" className="text-sm">
                      Issue refund to customer
                    </Label>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOrder(null);
                    setActionType(null);
                  }}
                >
                  Keep Order
                </Button>
                <Button
                  onClick={async () => {
                    await handleOrderAction();
                    setSelectedOrder(null);
                    setActionType(null);
                  }}
                  variant="destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </motion.div>
  );
};

export default Dashboard;