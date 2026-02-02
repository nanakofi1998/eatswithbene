import { useRef } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import OrderForm from "@/components/OrderForm";

const Index = () => {
  const orderFormRef = useRef<HTMLDivElement>(null);

  const scrollToOrderForm = () => {
    orderFormRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background"
    >
      <Navbar />
      <main>
        <Hero onOrderClick={scrollToOrderForm} />
        <OrderForm ref={orderFormRef} />
        
        {/* Footer */}
        <footer className="py-12 border-t border-border">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Powered by MNC - Eats With Bene. Made with love in Brampton.
            </p>
          </div>
        </footer>
      </main>
    </motion.div>
  );
};

export default Index;
