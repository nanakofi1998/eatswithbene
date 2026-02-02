// components/order/OrderDisclaimerModal.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  Clock, 
  Package, 
  Truck, 
  Check,
  Info,
  DollarSign,
  X,
  ChevronDown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OrderDisclaimerModalProps {
  onAgree: (agreed: boolean) => void;
  agreed: boolean;
}

const OrderDisclaimerModal = ({ onAgree, agreed }: OrderDisclaimerModalProps) => {
  const [open, setOpen] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const handleAgreeChange = (checked: boolean) => {
    onAgree(checked);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center space-x-3 cursor-pointer">
          <Checkbox
            id="terms-agreement"
            checked={agreed}
            onCheckedChange={handleAgreeChange}
            className="w-5 h-5 rounded-md data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
          />
          <Label htmlFor="terms-agreement" className="text-sm font-medium cursor-pointer">
            By ticking this, you agree to our{" "}
            <span className="text-amber-600 hover:text-amber-700 underline underline-offset-2">
              terms and conditions
            </span>
          </Label>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-0 border-0">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/40 to-orange-50/20 dark:from-amber-950/20 dark:to-orange-950/10 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Compact Header - Always visible */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-amber-200/50 dark:border-amber-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100/80 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200">
                    Important: Read Before Ordering
                  </h3>
                  <p className="text-xs text-amber-700/90 dark:text-amber-300/80">
                    Pricing, timing & policies
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-900/30"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Always-visible Important Summary */}
            <div className="p-5 space-y-5">
              {/* Quick Pricing + Timing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Pricing */}
                <div className="bg-white/60 dark:bg-gray-900/20 p-4 rounded-xl border border-amber-100/60 dark:border-amber-800/30">
                  <div className="flex items-center gap-2.5 mb-3">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Pricing per pack</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pre-order</span>
                      <span className="font-semibold text-green-600">$25</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Same-day (+$5 rush)</span>
                      <span className="font-semibold text-amber-600">$30</span>
                    </div>
                  </div>
                </div>

                {/* Timing & Delivery */}
                <div className="bg-white/60 dark:bg-gray-900/20 p-4 rounded-xl border border-amber-100/60 dark:border-amber-800/30">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Timing & Delivery</h4>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <span>Pickup: 20–30 min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <span>Delivery: 30–60 min</span>
                    </div>
                    <div className="text-xs italic mt-1 text-amber-700/80 dark:text-amber-300/70">
                      All times subject to confirmation
                    </div>
                  </div>
                </div>
              </div>

              {/* No Refund - always visible warning */}
              <div className="bg-red-50/60 dark:bg-red-950/20 p-4 rounded-xl border border-red-200/60 dark:border-red-800/30 flex items-start gap-3">
                <X className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-red-900 dark:text-red-200">No Refunds</h5>
                  <p className="text-sm text-red-700/90 dark:text-red-300/90">
                    All orders are final once placed. No refunds or cancellations.
                  </p>
                </div>
              </div>

              {/* "Read full details" toggle */}
              <button
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="text-sm text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 flex items-center gap-1.5 w-full justify-center py-2 bg-amber-100/50 dark:bg-amber-900/20 rounded-xl"
              >
                {showFullDetails ? "Hide details" : "Read full order policies"}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFullDetails ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Expanded Full Details */}
            <AnimatePresence>
              {showFullDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-t border-amber-200/50 dark:border-amber-800/40"
                >
                  <div className="p-5 space-y-6 bg-white/40 dark:bg-gray-900/10">
                    {/* Order Type Rules */}
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3 text-gray-900 dark:text-gray-100">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Order Type & Timing Rules
                      </h4>
                      <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>Pre-order:</strong> No rush fee, prepared for your selected time (recommended for accuracy).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span><strong>Same-day:</strong> +$5 rush fee, only available on weekends (Sat/Sun), minimum 20–30 min wait.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Delivery Notes */}
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3 text-gray-900 dark:text-gray-100">
                        <Truck className="w-4 h-4 text-blue-600" />
                        Delivery & Pickup
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        • Pickup: Ready in 20–30 minutes (subject to current volume)
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        • Delivery: 30–60 minutes, address must be accurate. We are not responsible for delays due to traffic or wrong address.
                      </p>
                    </div>

                    {/* Final Warning */}
                    <div className="bg-amber-50/70 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Please note:</strong> All times are estimates. We reserve the right to adjust or cancel orders if preparation constraints or unforeseen issues arise. No refunds after confirmation.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal Footer */}
            <div className="p-5 pt-0 mt-6">
              <div className="flex items-start gap-3 border-t border-amber-200/40 dark:border-amber-800/30 pt-5">
                <Checkbox
                  id="modal-agreement"
                  checked={agreed}
                  onCheckedChange={handleAgreeChange}
                  className="mt-1 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                />
                <Label htmlFor="modal-agreement" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  I have read and agree to the pricing, timing, no-refund policy, and that all times are estimates subject to confirmation.
                </Label>
              </div>
            </div>
          </Card>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDisclaimerModal;