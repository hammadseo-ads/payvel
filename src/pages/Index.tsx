import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { AuthMethodSelector } from "@/components/AuthMethodSelector";

const Index = () => {
  const { login, loginWithEmailMethod, loginWithSMSMethod, loginWithModalMethod, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <AuthMethodSelector
      onGoogleLogin={login}
      onEmailLogin={loginWithEmailMethod}
      onSMSLogin={loginWithSMSMethod}
      onShowAllOptions={loginWithModalMethod}
      isLoading={isLoading}
    />
  );
};

export default Index;
