import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Package,
  Clock,
  ChefHat,
  CheckCircle2,
  Truck,
  MapPin,
  ArrowLeft,
  Search,
  Copy,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-status-pending/10 text-status-pending border-status-pending/20",
    step: 1,
  },
  preparing: {
    label: "Preparing",
    icon: ChefHat,
    color: "bg-status-preparing/10 text-status-preparing border-status-preparing/20",
    step: 2,
  },
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    color: "bg-status-ready/10 text-status-ready border-status-ready/20",
    step: 3,
  },
  delivered: {
    label: "Delivered",
    icon: Truck,
    color: "bg-status-delivered/10 text-status-delivered border-status-delivered/20",
    step: 4,
  },
};

const foodTypeLabels: Record<string, string> = {
  "fried-rice": "Check Check Fried Rice (With Chicken, Sausage, Salad With Condiments & Free Drink)",
  "noodles-chicken": "Super Loaded Noodles (With Chicken)",
  "noodles-no-chicken": "Super Loaded Noodles (No Chicken)",
};

const orderTypeLabels: Record<string, string> = {
  "same-day": "Same Day (+$5 rush fee)",
  "pre-order": "Pre-order",
};

const ViewOrder = () => {
  const { toast } = useToast();
  const [trackingToken, setTrackingToken] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchOrder = async () => {
    if (!trackingToken.trim()) {
      setError("Please enter your tracking token");
      toast({
        title: "Missing token",
        description: "Please enter your tracking token",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_token', trackingToken.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError("Order not found. Please check your tracking token.");
        } else {
          setError("Error fetching order: " + error.message);
        }
        return;
      }

      setOrder(data);
      
      // Save to localStorage for recent searches
      const recentOrders = JSON.parse(localStorage.getItem("recent_orders") || "[]");
      const orderSummary = {
        order_id: data.order_id,
        tracking_token: data.tracking_token,
        customer_name: data.customer_name,
        food_type: data.food_type,
        status: data.order_status,
        created_at: data.created_at
      };
      
      const updatedRecent = [orderSummary, ...recentOrders.filter((o: any) => o.tracking_token !== data.tracking_token)];
      localStorage.setItem("recent_orders", JSON.stringify(updatedRecent));

      toast({
        title: "Order found!",
        description: "Tracking your order now",
      });
      
    } catch (err: any) {
      setError("Failed to fetch order. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Copied to clipboard",
        duration: 2000,
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchOrder();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background"
    >
      <Navbar />

      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Link>

            <h1 className="text-3xl sm:text-4xl font-display font-semibold mb-2">
              Track Your Order
            </h1>
            <p className="text-muted-foreground">
              Enter your tracking token to check your order status.
            </p>
          </motion.div>

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <Card className="p-6 sm:p-8 rounded-2xl shadow-soft border-border/50">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Enter Tracking Token</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the tracking token you received after placing your order.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="Enter your tracking token"
                        value={trackingToken}
                        onChange={(e) => setTrackingToken(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pl-12 h-14 rounded-xl text-lg font-mono bg-secondary/50 border-0"
                      />
                    </div>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-destructive mt-2 flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </motion.p>
                    )}
                  </div>
                  <Button
                    onClick={searchOrder}
                    disabled={loading || !trackingToken.trim()}
                    className="h-14 px-8 rounded-xl text-base font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Searching...
                      </div>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Track Order
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Don't have your token? Check your email confirmation or the order confirmation page.</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Order Display */}
          <AnimatePresence>
            {order ? (
              <motion.div
                key={order.order_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="p-6 sm:p-8 rounded-2xl shadow-soft border-border/50 mb-8">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {foodTypeLabels[order.food_type] || order.food_type}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`${statusConfig[order.order_status].color} font-medium`}
                        >
                          {(() => {
                            const StatusIcon = statusConfig[order.order_status].icon;
                            return <StatusIcon className="w-3.5 h-3.5 mr-1" />;
                          })()}
                          {statusConfig[order.order_status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ordered on {formatDate(order.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {order.tracking_token}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(order.tracking_token)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-8">
                    <div className="flex justify-between mb-3">
                      {Object.entries(statusConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        const isActive = config.step <= statusConfig[order.order_status].step;
                        const isCurrent = config.step === statusConfig[order.order_status].step;

                        return (
                          <div key={key} className="flex flex-col items-center">
                            <motion.div
                              initial={false}
                              animate={{
                                scale: isCurrent ? 1.1 : 1,
                                opacity: isActive ? 1 : 0.4,
                              }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                isActive
                                  ? "bg-foreground text-background"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </motion.div>
                            <span
                              className={`text-xs mt-2 hidden sm:block ${
                                isActive
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {config.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${((statusConfig[order.order_status].step - 1) / 3) * 100}%`,
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-foreground rounded-full"
                      />
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Customer Information
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Name</span>
                            <span className="font-medium">{order.customer_name}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Order Details
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Quantity</span>
                            <span className="font-medium">{order.number_of_packs} pack(s)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Order Type</span>
                            <span className="font-medium">
                              {orderTypeLabels[order.order_type] || order.order_type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment Method</span>
                            <span className="font-medium">{order.payment_method}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Delivery Information
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <span className="flex items-center">
                              {order.deliver_to_me ? (
                                <>
                                  <Truck className="w-4 h-4 mr-1" />
                                  Delivery to
                                </>
                              ) : (
                                <>
                                  <MapPin className="w-4 h-4 mr-1" />
                                  Pickup at
                                </>
                              )}
                            </span>
                            <span className="font-medium text-right">
                              {order.deliver_to_me
                                ? order.delivery_address
                                : order.pickup_location}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Payment Summary
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>${order.subtotal.toFixed(2)}</span>
                          </div>
                          {order.rush_fee > 0 && (
                            <div className="flex justify-between">
                              <span>Rush Fee</span>
                              <span>${order.rush_fee.toFixed(2)}</span>
                            </div>
                          )}
                          {order.delivery_fee > 0 && (
                            <div className="flex justify-between">
                              <span>Delivery Fee</span>
                              <span>${order.delivery_fee.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="pt-2 border-t flex justify-between font-semibold">
                            <span>Total</span>
                            <span>${order.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order ID */}
                  <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(order.order_id)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Order ID
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-display font-medium mb-2">
                  Track Your Order
                </h3>
                <p className="text-muted-foreground mb-6">
                  Enter your tracking token above to view your order details.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
};

export default ViewOrder;