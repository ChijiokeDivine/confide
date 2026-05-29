// src/lib/cdr.ts
import { CDRClient, initWasm } from "@piplabs/cdr-sdk";
import { getPlatformWallet } from "./wallet";

export const OWNER_WRITE_CONDITION = "0x4C9bFC96d7092b590D497A191826C3dA2277c34B";
const AENEID_API_URL = "http://172.192.41.96:1317";

let wasmInitialized = false;
let cdrClient: CDRClient | null = null;

export async function getCDRClient() {
  if (!wasmInitialized) {
    await initWasm();
    wasmInitialized = true;
  }

  if (!cdrClient) {
    const { publicClient, walletClient } = getPlatformWallet();
    cdrClient = new CDRClient({
      network: "testnet",
      publicClient,
      walletClient,
      apiUrl: AENEID_API_URL,
    });
  }

  return cdrClient;
}

/**
 * Parse a CDR vault UUID string into the numeric ID the SDK expects.
 * CDR UUIDs are hex strings like "0x0000000000000001" — convert to bigint/number.
 */
export function parseVaultUuid(uuidStr: string): number {
  // If it looks like a hex string, parse it
  if (uuidStr.startsWith("0x")) {
    return Number(BigInt(uuidStr));
  }
  // Otherwise assume it's already a decimal string
  return parseInt(uuidStr, 10);
}
