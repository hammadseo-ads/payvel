import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Send = () => {
  const { smartAccount, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidAddress = (address: string) => {
    return address.startsWith("0x") && address.length === 42;
  };

  const handleSend = async () => {
    if (!recipient || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!isValidAddress(recipient)) {
      toast.error("Invalid recipient address");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get ID token for authentication
      const idToken = await getIdToken();
      
      if (!idToken) {
        throw new Error("Authentication failed. Please log in again.");
      }

      // Check balance before sending
      const { data: balanceData, error: balanceError } = await supabase.functions.invoke("balance-fetch", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (balanceError) {
        throw new Error("Failed to check balance");
      }

      const currentBalance = parseFloat(balanceData.balance);
      const sendAmount = parseFloat(amount);

      if (currentBalance < sendAmount) {
        toast.error(`Insufficient balance. You have ${currentBalance.toFixed(4)} ETH`);
        setIsSubmitting(false);
        return;
      }

      // Submit via backend for policy checks
      const { data, error } = await supabase.functions.invoke("tx-submit", {
        body: {
          to: recipient,
          amount,
          chainId: "84532", // Base Sepolia
        },
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to submit transaction");
      }

      if (data.ok) {
        toast.success(
          data.userOpHash 
            ? "Transaction submitted! View on explorer."
            : "Transaction submitted successfully!"
        );
        
        // If we have a userOpHash, log it for debugging
        if (data.userOpHash) {
          console.log("UserOp Hash:", data.userOpHash);
          console.log("JiffyScan:", `https://jiffyscan.xyz/userOpHash/${data.userOpHash}?network=base-sepolia`);
        }
        
        navigate("/dashboard");
      } else {
        throw new Error(data.error || "Transaction failed");
      }
    } catch (error: any) {
      console.error("Send error:", error);
      toast.error(error.message || "Failed to send transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">Send</h1>
            <p className="text-muted-foreground">Send ETH to any address</p>
          </div>

          <Card className="p-6 glass-effect">
            <div className="space-y-6">
              <div>
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (ETH)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                <p className="text-sm text-muted-foreground">
                  <span className="text-secondary font-medium">Sponsored by Payvel:</span> Gas fees are covered under our policy limits
                </p>
              </div>

              <Button
                onClick={handleSend}
                disabled={isSubmitting || !recipient || !amount}
                className="w-full h-12 glow-effect"
              >
                {isSubmitting ? "Submitting..." : "Send Transaction"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Send;
