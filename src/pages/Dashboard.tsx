import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Send, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { WalletCard } from "@/components/WalletCard";
import { TransactionList } from "@/components/TransactionList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUPPORTED_TOKENS } from "@/config/tokens";

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
}


const Dashboard = () => {
  const { isAuthenticated, isLoading, smartAccountAddress, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (smartAccountAddress) {
      loadTransactions();
      fetchBalance();
    }
  }, [smartAccountAddress]);

  async function loadTransactions() {
    try {
      // Get ID token for authentication
      const idToken = await getIdToken();
      
      if (!idToken) {
        console.error("No ID token available");
        toast.error("Authentication failed. Please log in again.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("tx-list", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      
      if (error) throw error;
      
      if (data?.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error: any) {
      console.error("Failed to load transactions:", error);
      toast.error("Failed to load transactions");
    }
  }

  async function fetchBalance() {
    setIsLoadingBalance(true);
    try {
      const idToken = await getIdToken();
      
      if (!idToken) {
        console.error("No ID token available");
        return;
      }

      const tokenBalances: TokenBalance[] = [];

      // Fetch balance for each supported token
      for (const [symbol, token] of Object.entries(SUPPORTED_TOKENS)) {
        try {
          const balanceUrl = token.address 
            ? `balance-fetch?tokenAddress=${token.address}`
            : "balance-fetch";

          const { data, error } = await supabase.functions.invoke(balanceUrl, {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          
          if (error) throw error;
          
          if (data?.balance) {
            tokenBalances.push({
              symbol,
              balance: data.balance,
              decimals: token.decimals,
            });
          }
        } catch (error) {
          console.error(`Failed to fetch ${symbol} balance:`, error);
          // Add 0 balance for failed tokens
          tokenBalances.push({
            symbol,
            balance: "0.00",
            decimals: token.decimals,
          });
        }
      }

      setBalances(tokenBalances);
    } catch (error: any) {
      console.error("Failed to fetch balances:", error);
      toast.error("Failed to load balances");
      setBalances([
        { symbol: "ETH", balance: "0.00", decimals: 18 },
        { symbol: "USDC", balance: "0.00", decimals: 6 },
        { symbol: "USDT", balance: "0.00", decimals: 6 },
      ]);
    } finally {
      setIsLoadingBalance(false);
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

          <WalletCard 
            address={smartAccountAddress} 
            balances={balances}
            isLoading={isLoadingBalance}
          />

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
