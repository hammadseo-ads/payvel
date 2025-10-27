import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Send, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { WalletCard } from "@/components/WalletCard";
import { TransactionList } from "@/components/TransactionList";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { isAuthenticated, isLoading, smartAccountAddress } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (smartAccountAddress) {
      loadTransactions();
    }
  }, [smartAccountAddress]);

  async function loadTransactions() {
    try {
      const { data, error } = await supabase.functions.invoke("tx-list");
      
      if (error) throw error;
      
      if (data?.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  }

  if (isLoading || !smartAccountAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage your wallet and transactions</p>
          </div>

          <WalletCard address={smartAccountAddress} />

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => navigate("/receive")}
              size="lg"
              variant="outline"
              className="h-14"
            >
              <Download className="w-5 h-5 mr-2" />
              Receive
            </Button>
            <Button
              onClick={() => navigate("/send")}
              size="lg"
              className="h-14 glow-effect"
            >
              <Send className="w-5 h-5 mr-2" />
              Send
            </Button>
          </div>

          <TransactionList transactions={transactions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
