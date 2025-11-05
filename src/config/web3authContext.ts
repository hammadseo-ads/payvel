import { type Web3AuthContextConfig } from "@web3auth/modal/react";
import { WEB3AUTH_NETWORK, WALLET_CONNECTORS } from "@web3auth/modal";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    modalConfig: {
      connectors: {
        [WALLET_CONNECTORS.AUTH]: {
          label: "auth",
          loginMethods: {
            google: {
              name: "google login",
              authConnectionId: "w3a-google",
              groupedAuthConnectionId: "aggregate-sapphire",
            },
            email_passwordless: {
              name: "email passwordless login",
              authConnectionId: "w3a-email-passwordless",
              groupedAuthConnectionId: "aggregate-sapphire"
            },
          },
        }
      },
    },
  }
};

export default web3AuthContextConfig;
