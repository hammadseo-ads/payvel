import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from "@web3auth/base";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x14A34", // Base Sepolia (84532 in decimal)
  rpcTarget: "https://sepolia.base.org",
  displayName: "Base Sepolia",
  blockExplorerUrl: "https://sepolia.basescan.org",
  ticker: "ETH",
  tickerName: "Ethereum",
};

let web3authInstance: Web3Auth | null = null;

export async function getWeb3Auth() {
  if (web3authInstance) {
    return web3authInstance;
  }

  web3authInstance = new Web3Auth({
    clientId,
    web3AuthNetwork: "sapphire_devnet",
    chainConfig,
    uiConfig: {
      appName: "Payvel",
      mode: "dark",
      loginMethodsOrder: ["google", "email_passwordless", "sms_passwordless"],
    },
    modalConfig: {
      [WALLET_ADAPTERS.AUTH]: {
        label: 'auth',
        loginMethods: {
          google: {
            name: 'Continue with Google',
            showOnModal: true,
            authConnectionId: 'payvel-connection',
          },
          email_passwordless: {
            name: 'Continue with Email',
            showOnModal: true,
            authConnectionId: 'payvel-email-connection',
          },
          sms_passwordless: {
            name: 'Continue with SMS',
            showOnModal: true,
            authConnectionId: 'payvel-sms-connection',
          },
        },
      },
    },
  } as any);

  await web3authInstance.init();
  return web3authInstance;
}

export async function initWeb3Auth() {
  try {
    const instance = await getWeb3Auth();
    return instance;
  } catch (error) {
    console.error("Error initializing Web3Auth:", error);
    throw error;
  }
}

async function loginWithProvider(loginProvider?: string, authConnectionId?: string) {
  try {
    const web3auth = await getWeb3Auth();
    
    console.log(`🔐 Initiating login${loginProvider ? ` with ${loginProvider}` : ''}...`);
    
    let provider;
    
    if (loginProvider && authConnectionId) {
      // Explicit login with specific provider and connection ID
      provider = await web3auth.connectTo(WALLET_ADAPTERS.AUTH as any, {
        loginProvider,
        extraLoginOptions: {
          authConnectionId,
        },
      });
    } else {
      // Open modal with all options
      provider = await web3auth.connect();
    }
    
    if (!provider) {
      throw new Error("No provider returned from login");
    }
    
    // Get user info
    const userInfo = await web3auth.getUserInfo();
    console.log("✅ User Info:", userInfo ? "received" : "MISSING");
    console.log("👤 User email:", userInfo?.email);
    
    if (!userInfo) {
      throw new Error("Authentication failed - no user info received");
    }
    
    // Get Identity Token using getIdentityToken
    const tokenInfo = await web3auth.getIdentityToken();
    const idToken = typeof tokenInfo === 'string' ? tokenInfo : (tokenInfo as any)?.idToken;
    console.log("🔑 ID Token:", idToken ? "received" : "MISSING");
    
    if (!idToken) {
      throw new Error("Failed to retrieve ID token - authentication incomplete");
    }
    
    return { provider, idToken: idToken as string };
  } catch (error) {
    console.error("❌ Error during login:", error);
    throw error;
  }
}

export async function loginWithGoogle() {
  return loginWithProvider("google", "payvel-connection");
}

export async function loginWithEmail() {
  return loginWithProvider("email_passwordless", "payvel-email-connection");
}

export async function loginWithSMS() {
  return loginWithProvider("sms_passwordless", "payvel-sms-connection");
}

export async function loginWithModal() {
  return loginWithProvider();
}

export async function logout() {
  try {
    if (web3authInstance) {
      await web3authInstance.logout();
      web3authInstance = null;
    }
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}
