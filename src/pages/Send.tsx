import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { TokenSelector } from "@/components/TokenSelector";
import { toast } from "sonner";
import { getTokenBySymbol } from "@/config/tokens";
import { ethers } from "ethers";

const Send = () => {
  const { smartAccount } = useAuth();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("ETH");
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

    if (!smartAccount) {
      toast.error("Smart account not initialized. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getTokenBySymbol(selectedToken);
      if (!token) {
        throw new Error("Invalid token selected");
      }

      console.log(`📤 Preparing to send ${amount} ${token.symbol} to ${recipient}`);

      let transaction;

      if (token.address) {
        // ERC20 token transfer
        console.log("💰 Building ERC20 transfer transaction...");
        const erc20Interface = new ethers.utils.Interface([
          "function transfer(address to, uint256 amount)"
        ]);

        const data = erc20Interface.encodeFunctionData("transfer", [
          recipient,
          ethers.utils.parseUnits(amount, token.decimals)
        ]);

        transaction = {
          to: token.address,
          data: data,
        };
      } else {
        // Native ETH transfer
        console.log("💎 Building native ETH transfer transaction...");
        transaction = {
          to: recipient,
          value: ethers.utils.parseEther(amount),
        };
      }

      console.log("🚀 Sending transaction via Biconomy...");
      const userOpResponse = await smartAccount.sendTransaction(transaction);
      
      console.log("⏳ Waiting for transaction hash...");
      const { transactionHash } = await userOpResponse.waitForTxHash();
      
      console.log("✅ Transaction confirmed!");
      console.log("Transaction Hash:", transactionHash);
      console.log("BaseScan:", `https://sepolia.basescan.org/tx/${transactionHash}`);

      toast.success("Transaction sent successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("❌ Send error:", error);
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
            <p className="text-muted-foreground">Send crypto to any address</p>
          </div>

          <Card className="p-6 glass-effect">
            <div className="space-y-6">
              <div>
                <Label htmlFor="token">Select Token</Label>
                <TokenSelector
                  selectedToken={selectedToken}
                  onTokenChange={setSelectedToken}
                />
              </div>

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
                <Label htmlFor="amount">Amount ({selectedToken})</Label>
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
