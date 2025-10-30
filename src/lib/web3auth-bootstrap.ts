import { Web3Auth, WALLET_CONNECTORS, AUTH_CONNECTION } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

let web3authInstance: Web3Auth | null = null;

export async function bootstrapWeb3Auth() {
  if (web3authInstance) {
    console.log('✅ Returning existing Web3Auth instance');
    return web3authInstance;
  }

  console.log('🔧 Bootstrapping Web3Auth v10...');
  console.log('📋 Client ID:', clientId ? clientId.substring(0, 10) + '...' : 'MISSING');

  // V10 API - Chain config and branding managed via dashboard
  web3authInstance = new Web3Auth({
    clientId,
    web3AuthNetwork: "sapphire_devnet",
  });

  console.log('⚙️ Calling web3auth.init()...');
  
  try {
    await web3authInstance.init();
    console.log('✅ Web3Auth v10 initialized successfully');
    
    // Expose to window for debugging
    (window as any)._w3a = web3authInstance;
    
    console.log('🔍 Initial state:', {
      connected: (web3authInstance as any).connected ?? null,
      status: (web3authInstance as any).status ?? null,
      hasProvider: !!web3authInstance.provider,
    });
    
    return web3authInstance;
  } catch (error: any) {
    console.error('❌ Web3Auth init failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if it's the nextTick error
    if (error.message?.includes('nextTick') || error.stack?.includes('nextTick')) {
      console.error('🔴 This is a process.nextTick polyfill failure');
      console.error('Current process state:', {
        windowProcess: typeof window.process,
        globalProcess: typeof (globalThis as any).process,
        nextTick: typeof (globalThis as any).process?.nextTick,
      });
    }
    
    throw error;
  }
}

export function getWeb3AuthInstance() {
  if (!web3authInstance) {
    throw new Error("Web3Auth not bootstrapped. Call bootstrapWeb3Auth() first.");
  }
  return web3authInstance;
}
