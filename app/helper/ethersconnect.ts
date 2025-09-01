// @ts-ignore
import * as React from 'react'
// @ts-ignore
import { WalletClient, useWalletClient } from 'wagmi'
import { BrowserProvider, JsonRpcSigner } from 'ethers'

export interface WalletSigner {
  signer: JsonRpcSigner;
  transport: any;
}

export function walletClientToSigner(walletClient: any): WalletSigner {
    const { account, chain, transport } = walletClient
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    }
    const provider = new BrowserProvider(transport, network)
    const signer = new JsonRpcSigner(provider, account.address)
    return {
        signer,
        transport
    }
}