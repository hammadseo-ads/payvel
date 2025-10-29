import { Web3Auth, WALLET_CONNECTORS } from "@web3auth/modal";
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
    console.log('✅ Returning existing Web3Auth instance');
    return web3authInstance;
  }

  console.log('🔧 Initializing new Web3Auth instance...');
  console.log('📋 Client ID:', clientId ? clientId.substring(0, 10) + '...' : 'MISSING');
  console.log('🌐 Network:', 'sapphire_devnet');

  web3authInstance = new Web3Auth({
    clientId,
    web3AuthNetwork: "sapphire_devnet",
    chainConfig,
    uxMode: "redirect",
    uiConfig: {
      appName: "Payvel",
      mode: "dark",
      loginMethodsOrder: ["google", "email_passwordless", "sms_passwordless"],
    },
    modalConfig: {
      connectors: {
        [WALLET_CONNECTORS.AUTH]: {
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
    },
  } as any);

  console.log('⚙️ Calling web3auth.init()...');
  await web3authInstance.init();
  console.log('✅ Web3Auth initialized successfully');
  
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

async function loginWithModal() {
  try {
    const web3auth = await getWeb3Auth();
    
    console.log('🔐 Opening login modal with all options...');
    
    // Open modal with all options
    const provider = await web3auth.connect();
    
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

export async function login() {
  return loginWithModal();
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
