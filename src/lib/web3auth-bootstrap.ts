import { Web3Auth, WALLET_CONNECTORS } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

let web3authInstance: Web3Auth | null = null;

export async function bootstrapWeb3Auth() {
  if (web3authInstance) {
    console.log('✅ Returning existing Web3Auth instance');
    return web3authInstance;
  }

  console.log('🔧 Bootstrapping Web3Auth...');
  console.log('📋 Client ID:', clientId ? clientId.substring(0, 10) + '...' : 'MISSING');

  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x14A34", // Base Sepolia
    rpcTarget: "https://sepolia.base.org",
    displayName: "Base Sepolia",
    blockExplorerUrl: "https://sepolia.basescan.org",
    ticker: "ETH",
    tickerName: "Ethereum",
  };

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
  
  try {
    await web3authInstance.init();
    console.log('✅ Web3Auth initialized successfully');
    
    // Expose to window for debugging
    (window as any)._w3a = web3authInstance;
    
    console.log('🔍 Initial state:', {
      connected: (web3authInstance as any).connected ?? null,
      status: (web3authInstance as any).status ?? null,
      hasProvider: !!web3authInstance.provider,
    });
    
    return web3authInstance;
  } catch (error) {
    console.error('❌ Web3Auth init failed:', error);
    throw error;
  }
}

export function getWeb3AuthInstance() {
  if (!web3authInstance) {
    throw new Error("Web3Auth not bootstrapped. Call bootstrapWeb3Auth() first.");
  }
  return web3authInstance;
}
