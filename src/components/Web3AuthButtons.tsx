import { Button } from "@/components/ui/button";
import { Loader2, Mail, MessageSquare } from "lucide-react";
import { useState } from "react";
import { loginWithGoogle, loginWithEmail, loginWithSMS } from "@/lib/web3auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Web3AuthButtonsProps {
  onSuccess?: () => void;
}

export const Web3AuthButtons = ({ onSuccess }: Web3AuthButtonsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showSMSDialog, setShowSMSDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setLoadingProvider("Google");
    
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error logging in with Google:", error);
      toast({
        title: "Login Failed",
        description: error?.message || "Failed to login with Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingProvider("Email");
    setShowEmailDialog(false);
    
    try {
      await loginWithEmail(email);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error logging in with Email:", error);
      toast({
        title: "Login Failed",
        description: error?.message || "Failed to login with Email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
      setEmail("");
    }
  };

  const handleSMSLogin = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingProvider("SMS");
    setShowSMSDialog(false);
    
    try {
      await loginWithSMS(phone);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error logging in with SMS:", error);
      toast({
        title: "Login Failed",
        description: error?.message || "Failed to login with SMS",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
      setPhone("");
    }
  };

  return (
    <>
      <div className="w-full space-y-3">
        <Button
          size="lg"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-14 text-base font-semibold"
        >
        {loadingProvider === "Google" ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={() => setShowEmailDialog(true)}
          disabled={isLoading}
          className="w-full h-14 text-base font-semibold"
        >
        {loadingProvider === "Email" ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Mail className="w-5 h-5 mr-2" />
            Continue with Email
          </>
        )}
      </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={() => setShowSMSDialog(true)}
          disabled={isLoading}
          className="w-full h-14 text-base font-semibold"
        >
        {loadingProvider === "SMS" ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <MessageSquare className="w-5 h-5 mr-2" />
            Continue with SMS
          </>
        )}
        </Button>
      </div>

      {/* Email Input Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continue with Email</DialogTitle>
            <DialogDescription>
              Enter your email address to receive a login code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
              />
            </div>
            <Button onClick={handleEmailLogin} className="w-full">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Input Dialog */}
      <Dialog open={showSMSDialog} onOpenChange={setShowSMSDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continue with SMS</DialogTitle>
            <DialogDescription>
              Enter your phone number with country code (e.g., +1234567890)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSMSLogin()}
              />
            </div>
            <Button onClick={handleSMSLogin} className="w-full">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
