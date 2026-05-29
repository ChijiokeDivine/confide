# CDR Private Survey Tool

A privacy-first survey platform where every response is encrypted via **Story Protocol's CDR (Confidential Data Registry)** before storage. Only the survey creator can decrypt and read responses.

---

## Architecture

```
Respondent browser
  → fills form at /forms/[formId]
  → POST /api/respond  ← encrypts payload via CDR TEE global pubkey
                       ← allocates per-response CDR vault
                       ← writes ciphertext on-chain
                       ← records vault UUID in Supabase

Creator browser
  → views /forms/[formId]/results
  → GET /api/results?formId=xxx  ← fetches vault UUIDs from Supabase
                                 ← calls cdrClient.consumer.accessCDR per vault
                                 ← decrypts via platform wallet (creator's read condition)
                                 ← aggregates + returns
```

---

## Setup

### 1. Environment variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# CDR / Story Protocol
# Fund this wallet with testnet IP tokens (Aeneid faucet)
PLATFORM_WALLET_PRIVATE_KEY=0x...

# Wallet encryption (change this secret, keep it safe)
WALLET_ENCRYPTION_KEY=your-32-char-secret-key-here-!!
```

### 2. Supabase schema

Run `supabase_schema.sql` in your Supabase SQL editor. This creates:
- `creator_accounts` — linked to Supabase Auth users, stores wallet address
- `forms` — survey definitions with questions (JSONB)
- `responses` — CDR vault UUIDs per submission

### 3. Fund the platform wallet

Get testnet IP tokens from the Aeneid faucet:  
`https://faucet.story.foundation`

The platform wallet pays for CDR vault allocation gas on behalf of users.

### 4. Install & run

```bash
npm install
npm run dev
```

---

## Key files

| File | Purpose |
|---|---|
| `src/middleware.ts` | Route protection — redirects unauthenticated users |
| `src/lib/auth-actions.ts` | Server actions for login/signup/logout |
| `src/lib/wallet.ts` | Platform wallet + per-user wallet generation + AES-256-GCM encryption |
| `src/lib/cdr.ts` | CDR client singleton + vault UUID parsing |
| `src/app/api/forms/route.ts` | Create form (allocates CDR aggregator vault) + list forms |
| `src/app/api/respond/route.ts` | Submit response (allocate vault → encrypt → write) |
| `src/app/api/results/route.ts` | Decrypt + aggregate results (creator only) |
| `src/app/forms/new/page.tsx` | Survey builder UI |
| `src/app/forms/[formId]/page.tsx` | Public survey page |
| `src/app/forms/[formId]/results/page.tsx` | Results dashboard |
| `src/app/dashboard/page.tsx` | Creator dashboard |

---

## What's been built vs what remains

### ✅ Implemented
- Supabase auth (signup → auto wallet generation, login, logout, middleware)
- Form builder with 6 question types (text, textarea, radio, checkbox, scale, email)
- Native form submission → CDR encryption pipeline (no Tally dependency)
- Results page: summary charts + individual response view
- Dashboard: form list, response counts, copy share link, toggle active/closed
- Fixed `/api/results` uuid bug (was hardcoded `uuid: 0`)
- Proper `creator_id` FK on forms (RLS enforced)

### 🔲 Remaining / Future
- **Email confirmations** — Supabase sends one by default; configure in dashboard
- **Form analytics** — submission time series, completion rate
- **Response export** — CSV download of decrypted data
- **Custom domains** — for white-label survey links
- **Webhook support** — notify creator on new response
- **Form templates** — common survey patterns (NPS, feedback, etc.)
- **Rate limiting** — prevent response flooding
- **Question branching** — conditional logic based on answers
