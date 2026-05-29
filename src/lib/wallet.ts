// src/lib/wallet.ts
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const AENEID_RPC_URL = "https://aeneid.storyrpc.io";

// Story Protocol Aeneid testnet chain config
const aeneidChain = {
  id: 1315,
  name: "Story Aeneid Testnet",
  nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
  rpcUrls: { default: { http: [AENEID_RPC_URL] } },
} as const;

// ─── Platform wallet (used by API routes for CDR operations) ─────────────────
export function getPlatformWallet() {
  const pk = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  if (!pk || pk === "0x_YOUR_FUNDED_TESTNET_PRIVATE_KEY") {
    throw new Error("PLATFORM_WALLET_PRIVATE_KEY is not configured.");
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  const publicClient = createPublicClient({
    chain: aeneidChain,
    transport: http(AENEID_RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: aeneidChain,
    transport: http(AENEID_RPC_URL),
  });

  return { account, publicClient, walletClient };
}

// ─── Per-user wallet generation ───────────────────────────────────────────────
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY ?? "change-me-32-chars-secret-key!!";

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, "cdr-survey-salt", 32);
}

export function generateWallet(): { address: string; encryptedPrivateKey: string } {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  // AES-256-GCM encrypt the private key
  const key = deriveKey(ENCRYPTION_KEY);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Store as: iv:authTag:ciphertext (all hex)
  const stored = `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;

  return { address: account.address, encryptedPrivateKey: stored };
}

export function decryptPrivateKey(encrypted: string): `0x${string}` {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(":");
  const key = deriveKey(ENCRYPTION_KEY);
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8") as `0x${string}`;
}
