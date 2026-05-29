// src/app/api/wallet/balance/route.ts
import { NextResponse } from "next/server";
import { getPlatformWallet } from "@/lib/wallet";

export async function GET() {
  try {
    const { account, publicClient } = getPlatformWallet();
    const balance = await publicClient.getBalance({ address: account.address });
    
    return NextResponse.json({
      address: account.address,
      balance: balance.toString(),
      balanceFormatted: (Number(balance) / 1e18).toFixed(4)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get wallet balance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
