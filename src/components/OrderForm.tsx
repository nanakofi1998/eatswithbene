// components/order/OrderForm.tsx
import { useState, forwardRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Check, Loader2, MapPin, Truck, CreditCard, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import OrderDisclaimerModal from "./OrderDisclaimer";

const foodTypes = [
  { value: "fried-rice", label: "Check Check Fried Rice (With Chicken, Sausage, Salad With Condiments & Free Drink)", price: 25 },
  { value: "noodles-chicken", label: "Super Loaded Noodles (With Chicken)", price: 25 },
  { value: "noodles-no-chicken", label: "Super Loaded Noodles (No Chicken)", price: 20 },
];

const baseOrderTypes = [
  { value: "same-day", label: "Same Day (+$5 rush fee)" },
  { value: "pre-order", label: "Pre-order" },
];

interface OrderFormProps {
  onOrderSubmit?: (order: OrderData) => void;
}

export interface OrderData {
  id: string;
  name: string;
  foodType: string;
  packs: number;
  orderType: string;
  pickupLocation: string;
  deliverToMe: boolean;
  deliveryAddress?: string;
  paymentMethod: string;
  status: "pending" | "preparing" | "ready" | "delivered";
  createdAt: Date;
}

const OrderForm = forwardRef<HTMLDivElement, OrderFormProps>(
  ({ onOrderSubmit }, ref) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string>("");
    const [trackingToken, setTrackingToken] = useState<string>("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const [formData, setFormData] = useState({
      name: "",
      foodType: "",
      packs: 1,
      orderType: "",
      pickupLocation: "Brampton",
      deliverToMe: false,
      deliveryAddress: "",
      paymentMethod: "e-transfer",
    });

    const [availableOrderTypes, setAvailableOrderTypes] = useState<typeof baseOrderTypes>([]);
    const [isWeekend, setIsWeekend] = useState(false);

    useEffect(() => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekend = dayOfWeek === 0 || dayOfWeek === 6;

      setIsWeekend(weekend);

      let types: typeof baseOrderTypes;
      let defaultType: string;

      if (weekend) {
        types = baseOrderTypes.filter(t => t.value === "same-day");
        defaultType = "same-day";
      } else {
        types = baseOrderTypes.filter(t => t.value === "pre-order");
        defaultType = "pre-order";
      }

      setAvailableOrderTypes(types);

      setFormData(prev => ({
        ...prev,
        orderType: defaultType,
      }));
    }, []);

    const selectedFood = foodTypes.find((f) => f.value === formData.foodType);
    const basePricePerPack = selectedFood ? selectedFood.price : 0;
    const subtotal = basePricePerPack * formData.packs;

    const rushFee = formData.orderType === "same-day" ? 5 : 0;
    const deliveryFee = formData.deliverToMe ? 8 : 0;
    const total = subtotal + rushFee + deliveryFee;

    const handlePacksChange = (delta: number) => {
      setFormData((prev) => ({
        ...prev,
        packs: Math.max(1, Math.min(20, prev.packs + delta)),
      }));
    };

    const copyToClipboard = (text: string, description: string) => {
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: "Copied!",
          description: `${description} copied to clipboard`,
          duration: 2000,
        });
      }).catch(() => {
        toast({
          title: "Failed to copy",
          description: `Please copy manually: ${text}`,
          variant: "destructive",
        });
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!agreedToTerms) {
        toast({
          title: "Agreement Required",
          description: "You must agree to the terms and conditions to place an order.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.name.trim()) {
        toast({
          title: "Missing information",
          description: "Please enter your name.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.foodType) {
        toast({
          title: "Missing information",
          description: "Please select a food type.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.orderType) {
        toast({
          title: "Missing information",
          description: "Please select an order type.",
          variant: "destructive",
        });
        return;
      }

      if (formData.deliverToMe && !formData.deliveryAddress.trim()) {
        toast({
          title: "Delivery address required",
          description: "Please enter your delivery address.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const { data, error } = await supabase
          .from("orders")
          .insert({
            customer_name: formData.name,
            food_type: formData.foodType,
            number_of_packs: formData.packs,
            order_type: formData.orderType,

            delivery_method: formData.deliverToMe ? "delivery" : "pickup",
            deliver_to_me: formData.deliverToMe,
            delivery_address: formData.deliverToMe ? formData.deliveryAddress : null,
            pickup_location: formData.pickupLocation,

            payment_method: formData.paymentMethod,

            subtotal,
            rush_fee: rushFee,
            delivery_fee: deliveryFee,
            total_amount: total,

            order_status: "pending",
            payment_status: "awaiting confirmation",
          })
          .select("order_id, tracking_token")
          .single();


        if (error) throw error;

        // Save order ID and tracking token
        setOrderId(data.order_id);
        setTrackingToken(data.tracking_token);

        // Save to localStorage for tracking
        const orderData = {
          order_id: data.order_id,
          tracking_token: data.tracking_token,
          customer_name: formData.name,
          food_type: formData.foodType,
          status: 'pending',
          created_at: new Date().toISOString()
        };

        const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
        localStorage.setItem("orders", JSON.stringify([orderData, ...existingOrders]));
        localStorage.setItem("last_order_token", data.tracking_token);

        setIsSubmitting(false);
        setIsSuccess(true);

        toast({
          title: "Order confirmed! 🎉",
          description: (
            <div className="space-y-2">
              <p>Your order has been placed successfully.</p>
              <p className="text-sm font-medium">Save your tracking token to check status later!</p>
            </div>
          ),
          duration: 5000,
        });

      } catch (error: any) {
        console.error('Error submitting order:', error);
        toast({
          title: "Order failed",
          description: error.message || "There was an error placing your order. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    };

    const resetForm = () => {
      setIsSuccess(false);
      setOrderId("");
      setTrackingToken("");
      setAgreedToTerms(false);
      setFormData({
        name: "",
        foodType: "",
        packs: 1,
        orderType: isWeekend ? "same-day" : "pre-order",
        pickupLocation: "Brampton",
        deliverToMe: false,
        deliveryAddress: "",
        paymentMethod: "e-transfer",
      });
    };

    const inputVariants = {
      focus: { scale: 1.02, transition: { duration: 0.2 } },
      blur: { scale: 1, transition: { duration: 0.2 } },
    };

    if (isSuccess) {
      return (
        <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8" id="order-form">
          <div className="container mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-display font-semibold mb-4">
                Order Confirmed! 🎉
              </h2>
              <p className="text-muted-foreground">
                Your order has been placed successfully. Here are your tracking details:
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card rounded-3xl p-8 sm:p-10 shadow-medium border border-border/50"
            >
              <div className="space-y-8">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Order Summary</h3>
                    <p className="text-muted-foreground">
                      {formData.packs} × {selectedFood?.label}
                    </p>
                  </div>

                  {/* Tracking Token */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      <span className="flex items-center gap-2">
                        Tracking Token
                        <span className="text-xs text-amber-600 font-medium">
                          (Save this to track your order!)
                        </span>
                      </span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={trackingToken}
                        readOnly
                        className="font-mono bg-secondary/50 border-0"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(trackingToken, "Tracking token")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use this token to track your order status on the tracking page.
                    </p>
                  </div>

                  {/* Payment Instructions */}
                  <div className="space-y-2 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                    <Label className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Payment Instructions
                    </Label>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Send e-Transfer to:</p>
                        <p className="font-mono text-sm">benedictaadu230@gmail.com</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard("benedictaadu230@gmail.com", "Email")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                      Please send payment within 1 hour to confirm your order.
                    </p>
                  </div>

                  {/* Order Status */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Order Status</span>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
                        Pending Payment
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Payment Confirmation</span>
                        <span className="text-muted-foreground">Awaiting</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Food Preparation</span>
                        <span className="text-muted-foreground">Pending</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Ready for Pickup/Delivery</span>
                        <span className="text-muted-foreground">Pending</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <Button
                    className="w-full h-14 rounded-xl text-base font-medium"
                    onClick={() => {
                      toast({
                        title: "Track your order",
                        description: "Use your tracking token on the tracking page.",
                        action: (
                          <Button
                            size="sm"
                            onClick={() => {
                              window.location.href = `/track?token=${trackingToken}`;
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Track Now
                          </Button>
                        ),
                      });
                    }}
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Track Your Order
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-14 rounded-xl text-base font-medium"
                    onClick={resetForm}
                  >
                    Place Another Order
                  </Button>
                </div>

                {/* Important Notes */}
                <div className="text-xs text-muted-foreground space-y-2">
                  <p className="font-medium">Important:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Save your tracking token to check order status later</li>
                    <li>Send e-Transfer payment within 1 hour</li>
                    <li>You will receive confirmation email once payment is received</li>
                    <li>For questions, contact: benedictaadu230@gmail.com</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      );
    }

    return (
      <section ref={ref} className="py-24 px-4 sm:px-6 lg:px-8" id="order-form">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-semibold mb-4">
              Place Your Order
            </h2>
            <p className="text-muted-foreground">
              Fill in the details below and we'll have your food ready.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="bg-card rounded-3xl p-8 sm:p-10 shadow-medium border border-border/50 relative"
          >
            <div className="absolute -top-3 left-6 text-xs text-muted-foreground/70 font-medium bg-background px-3 py-1 rounded-full shadow-sm border border-border/40 z-10">
              Slots Available Today: <span className="text-green-600 font-semibold">12</span> / 30
            </div>

            <div className="space-y-8">
              {/* Name */}
              <motion.div whileFocus="focus" variants={inputVariants} className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Your Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-12 rounded-xl bg-secondary/50 border-0 focus:bg-background focus:ring-2 focus:ring-foreground/10 transition-all"
                />
              </motion.div>

              {/* Food Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Food Type</Label>
                <Select
                  value={formData.foodType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, foodType: value }))}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-0 focus:ring-2 focus:ring-foreground/10">
                    <SelectValue placeholder="Select a dish" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {foodTypes.map((food) => (
                      <SelectItem key={food.value} value={food.value} className="rounded-lg">
                        {food.label} – ${food.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Packs */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Number of Packs</Label>
                <div className="flex items-center justify-center space-x-6 py-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePacksChange(-1)}
                    disabled={formData.packs <= 1}
                    className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-secondary/80"
                  >
                    <Minus className="w-5 h-5" />
                  </motion.button>

                  <motion.span
                    key={formData.packs}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-display font-semibold w-16 text-center"
                  >
                    {formData.packs}
                  </motion.span>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePacksChange(1)}
                    disabled={formData.packs >= 20}
                    className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-secondary/80"
                  >
                    <Plus className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Order Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Order Type</Label>
                <div className={`h-12 rounded-xl px-4 flex items-center justify-between ${isWeekend
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800"
                  }`}
                >
                  <span className="font-medium">
                    {isWeekend ? "Same Day Order" : "Pre-Order"}
                  </span>
                  <span className="text-sm">
                    {isWeekend ? "+$5 rush fee" : "No rush fee"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isWeekend
                    ? "Same-day orders are available on weekends."
                    : "Orders placed on weekdays are treated as pre-orders."}
                </p>
              </div>

              {/* Pickup Location */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Pickup Location</span>
                </Label>
                <Input
                  type="text"
                  value={formData.pickupLocation}
                  readOnly
                  disabled={formData.deliverToMe}
                  className={`h-12 rounded-xl border-0 transition-all ${formData.deliverToMe ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-secondary/50"
                    }`}
                />
              </div>

              {/* Deliver to Me */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="deliver"
                    checked={formData.deliverToMe}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deliverToMe: e.target.checked,
                        deliveryAddress: e.target.checked ? prev.deliveryAddress : "",
                      }))
                    }
                    className="w-5 h-5 rounded-md border-2 border-gray-300 checked:bg-amber-600 checked:border-amber-600 focus:ring-amber-600"
                  />
                  <Label
                    htmlFor="deliver"
                    className="text-sm font-medium flex items-center space-x-2 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Deliver to Me (+$8 fee)</span>
                  </Label>
                </div>

                <AnimatePresence>
                  {formData.deliverToMe && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2">
                        <Label htmlFor="address" className="text-sm font-medium">
                          Delivery Address
                        </Label>
                        <Input
                          id="address"
                          placeholder="Enter your delivery address"
                          value={formData.deliveryAddress}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, deliveryAddress: e.target.value }))
                          }
                          className="mt-2 h-12 rounded-xl bg-secondary/50 border-0 focus:bg-background focus:ring-2 focus:ring-foreground/10 transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment Method</span>
                </Label>
                <div className="flex items-center gap-3 bg-secondary/50 p-4 rounded-xl border border-border/30">
                  <div className="text-base font-medium">e-Transfer</div>
                  <div className="relative flex-1">
                    <Input
                      value="benedictaadu230@gmail.com"
                      readOnly
                      className="pr-10 bg-background/50 border-0 text-sm text-muted-foreground cursor-pointer"
                      onClick={() => copyToClipboard("benedictaadu230@gmail.com", "Email")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                      onClick={() => copyToClipboard("benedictaadu230@gmail.com", "Email")}
                    >
                      <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Send payment to the email above after placing your order.
                </p>
              </div>

              {/* Price Summary */}
              <div className="bg-secondary/40 rounded-2xl p-6 space-y-3 border border-border/30">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({formData.packs} × ${basePricePerPack})</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {rushFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Same-day rush fee</span>
                    <span className="text-amber-600">+${rushFee.toFixed(2)}</span>
                  </div>
                )}
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery fee</span>
                    <span className="text-amber-600">+${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-border flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Terms and Conditions Agreement */}
              <div className="pt-4 border-t border-border/40">
                <OrderDisclaimerModal
                  onAgree={setAgreedToTerms}
                  agreed={agreedToTerms}
                />
              </div>

              {/* Submit */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isSubmitting || isSuccess || total === 0 || !agreedToTerms}
                  className={`w-full h-14 rounded-xl text-base font-medium relative overflow-hidden transition-all duration-300 ${!agreedToTerms ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center space-x-2"
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </motion.div>
                    ) : (
                      <motion.span key="default">
                        Confirm Order – ${total.toFixed(2)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
                {!agreedToTerms && (
                  <p className="text-xs text-amber-600 mt-2 text-center">
                    You must agree to the terms and conditions to place your order.
                  </p>
                )}
              </motion.div>
            </div>
          </motion.form>
        </div>
      </section>
    );
  }
);

OrderForm.displayName = "OrderForm";

export default OrderForm;