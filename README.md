
# Confyde: Privacy-First Survey Tool

---

## The Problem

Let’s start with what’s broken today:

### Web2 Survey Problems
Traditional survey tools (Google Forms, SurveyMonkey, Typeform, etc.) all work the same basic way:
- You fill out a form → your raw answers hit their servers → they store it in a database (maybe encrypted, but they hold the keys) → they can read your answers whenever they want.

Worse:
- A breach exposes all responses at once.
- You have to trust the company not to sell your data, use it for ads, or give it to governments.
- You never really know who’s looking at what you wrote.

### Web3 Survey Problems
Most "web3 survey tools" don’t fix this—they just add wallet login to the same web2 stack:
- Responses still live in a regular database.
- You still have to trust the platform operator.
- A lot of them overcomplicate things with tokens when all you want is privacy.

### The Specific Pain Point That Drove Me
I’ve run surveys where people held back honest answers because they were worried about who’d see them. For sensitive topics—workplace feedback, market research on unpopular opinions, personal health questions—you need a guarantee that only the person who made the survey can read what you write.

---

## Why I Built This

I wanted something simple:
- Familiar web2 UX (email login, easy form builder)
- Web3-grade privacy (cryptographic guarantees, no middleman can read responses)
- No friction for respondents (no wallet needed to fill out a form)
- No rent-seeking (no token gate, no paywall, just privacy by default)

Here’s how I thought about building it:
- Start with something people already know how to use (a regular web app).
- Hide the crypto stuff—most people don’t care how it works, just that it works.
- Lean hard into on-chain primitives for privacy, not for hype.

---

## Features: Technical Breakdown (With Concerns &amp; Solutions)

### Web2 Features (The Familiar Stuff)
First, all the basics you’d expect from a modern survey tool:

| Feature | How it works | Concern I addressed | Solution |
|---------|--------------|---------------------|----------|
| User authentication | Email/password login plus Google sign-in via Supabase Auth | People don’t want to remember another password, and account security matters | Use Supabase Auth for secure session handling, password reset, Google OAuth, SSR cookie-based callback handling, and conditional "set password" flow for Google-only accounts |
| Form builder | A clean, type-safe survey builder with templates, many question types, and an AI form generator | Building a good form UX is hard; also need to validate questions to avoid broken surveys | Keep it simple but powerful: text, textarea, email, radio, checkbox, scale, rating, slider, dropdown, phone, date, time, datetime. Also let creators generate a professional first draft from a prompt using Groq, then edit every question manually before publishing. |
| Survey sharing | Copy a public link and send it to anyone | Need to make sure public links are unguessable but shareable | Use UUIDs for form IDs (long, random, impossible to brute-force) |
| Dashboard | Creator sees all their forms, response counts, active/closed toggle | Need to make sure only the right person can see the dashboard | Row Level Security (RLS) on Supabase: every query for forms/responses is scoped to the authenticated user |
| Results dashboard | Charts, individual response view, summary stats | Results need to feel snappy, even when you have lots of responses | Split API into `countOnly` (cheap, no crypto) and full decrypt (pays gas per response); let you check count first before decrypting everything |

#### AI Form Builder
**What it is**: A creator can describe the survey they want in plain English and get back a complete first draft with a title, description, and structured questions.

**Concern 1**: AI-generated forms can be vague, low quality, or inconsistent.
**Solution**: Constrain generation to a strict JSON schema, limit question types, normalize generated question IDs server-side, and tune prompts for professional, compliance-ready use cases like HR, legal, medical, and governance.

**Concern 2**: AI should speed up creation, not take away control.
**Solution**: AI only pre-populates the builder. The creator can still edit, reorder, add, or delete every question before publishing.

---

### Web3 Features (The Privacy Magic)
Now the good stuff—this is what makes Confyde different:

#### 1. End-to-End Encrypted Responses via Story Protocol CDR
**What it is**: Every response gets encrypted *before* it’s stored—using Story Protocol’s Confidential Data Registry (CDR). CDR uses Trusted Execution Environments (TEEs) to handle encryption/decryption securely.

**Concern 1**: If I encrypt responses on the client, what happens if the user refreshes or loses their keys?
**Solution**: Never encrypt on the client alone—always encrypt server-side via CDR, with a read condition tied to the creator’s wallet. That way, only the creator can decrypt.

**Concern 2**: What if CDR goes down or changes their API?
**Solution**: Abstract CDR behind a thin wrapper (`@/lib/cdr-server.ts`); if we ever need to swap it out, we only change one place. Also store only vault UUIDs in our DB, not ciphertext directly—keeps Supabase simple.

#### 2. Wallet-Based Decryption (Creator Only)
**What it is**: When you create a form, you get a wallet (generated server-side, encrypted at rest with AES-256-GCM). Only that wallet can decrypt responses.

**Concern 1**: Wallet storage is hard—if we lose wallets, we lose access to all responses forever.
**Solution**:
- Use `WALLET_ENCRYPTION_KEY` env var to encrypt wallets before storing them in `creator_accounts` table.
- Wallets are generated deterministically? No—unique per creator, never reused across forms.
- Keep the encryption key *out* of git, *out* of the database, only in environment variables.

**Concern 2**: What if the creator loses their account?
**Solution**: Right now, recovery is via Supabase Auth (reset password). Later we can add seed phrase backup, but start simple.

#### 3. Whitelisted Surveys (Optional)
**What it is**: Creators can restrict surveys to a pre-approved list of respondents (e.g., only employees with a company email).

**Concern 1**: Storing a whitelist means storing PII (like emails)—bad for privacy.
**Solution**: Never store raw identifiers! Store only salted (well, *formId-salted*) SHA-256 hashes:
- Hash = SHA256(`${formId}:${identifier.toLowerCase().trim()}`)
- Compare hashes at runtime—we never see the real identifiers, just check if a hash exists.

**Concern 2**: What if someone tries to submit twice with the same identifier?
**Solution**: Track `submitted_at` on `whitelist_entries`; mark entries as used atomically when a response goes through (so no double-submit).

#### 4. Gasless Experience For Everyone
**What it is**: Creators don’t need to hold gas tokens, respondents never touch crypto at all.

**Concern**: Someone has to pay for CDR vault gas—if we make creators pay, adoption dies.
**Solution**: Use a single platform wallet to pay gas on behalf of users:
- Fund it with testnet IP tokens (from Aeneid faucet) for now.
- Store its private key encrypted as `PLATFORM_WALLET_PRIVATE_KEY`.
- Add a `skipCDR` flag for local development so you can build without crypto.

---

## Architecture (Simplified)

Here’s the full flow, end-to-end:

### For a Respondent:
1. Open public survey link: `https://confide.app/forms/[formId]`
2. Fill out the form (no wallet needed!)
3. Hit "Submit"
4. Client sends answers to `POST /api/respond`
5. Server:
   - Validates the form is still active
   - If whitelist enabled: checks the identifier hash
   - Encrypts answers via CDR (uses creator’s wallet as the read condition)
   - Allocates a unique CDR vault for the response
   - Stores *only the vault UUID* in Supabase `responses` table
   - Marks whitelist entry as used (if applicable)
6. Respondent sees "Thank you!"

### For a Creator:
1. Log in via email/password or Google
2. Build a form from scratch, start from a template, or generate one with AI from a prompt
3. Hit "Create survey"
4. Server:
   - Authenticates via Supabase
   - Allocates a CDR aggregator vault (optional, future use)
   - Stores form definition in Supabase `forms` table (RLS protected)
   - If whitelist enabled: stores hashed identifiers in `whitelist_entries`
5. Creator copies share link and sends it out
6. Later, creator opens "Results" page
7. Client calls `GET /api/results?formId=xxx`
8. Server:
   - Verifies creator owns the form (RLS + explicit `creator_id` check)
   - Fetches all vault UUIDs for the form
   - For each vault: calls `decryptResponse()` via CDR (pays gas from platform wallet)
   - Aggregates decrypted answers into charts/stats
   - Returns results to client

---

## Who This Is For

Confyde is built for:
1. **HR teams**: Running anonymous workplace feedback surveys where honesty matters.
2. **Market researchers**: Asking sensitive questions without worrying about data leaks.
3. **Product teams**: Collecting user feedback with a privacy guarantee that builds trust.
4. **Anyone**: Who wants to collect responses and give respondents peace of mind.

---

## Impact

This isn’t just another survey tool—it changes the dynamic:
- **Respondents**: Can answer honestly because they know only the creator can read their answers.
- **Creators**: Get higher-quality, more truthful data because people don’t hold back.
- **Everyone**: No platform lock-in, no data mining, no privacy surprises.

---

## Setup (If You Want To Run It Yourself)

### 1. Environment Variables
Create `.env.local` at the root:
```env
# Supabase (your auth + database)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI form generation
GROQ_API_KEY=[your-groq-api-key]

# CDR / Story Protocol
# Fund this wallet with testnet IP tokens (https://faucet.story.foundation)
PLATFORM_WALLET_PRIVATE_KEY=0x_[your-fundend-private-key]_here

# Wallet encryption (KEEP THIS SAFE, 32+ CHARS)
WALLET_ENCRYPTION_KEY=change-this-to-something-secure-and-32-chars-min
```

### 2. Database Schema
Run `supabase_schema.sql` in your Supabase SQL Editor to set up tables:
- `creator_accounts`: Links Supabase Auth users to wallets
- `forms`: Survey definitions + whitelist settings
- `responses`: CDR vault UUIDs per submission
- `whitelist_entries`: Hashed access list entries

### 3. Auth Providers
In Supabase Auth, enable:
- Email/password authentication
- Google OAuth

For Google OAuth, set your redirect URL to:
- `http://localhost:3000/auth/callback` for local development
- Your production app URL with `/auth/callback` appended in production

### 4. Install & Run
```bash
npm install
npm run dev
```

---

## Key Files To Understand The Codebase

| File | What it does |
|------|--------------|
| `src/middleware.ts` | Route guard: redirects unauthenticated users from protected routes |
| `src/lib/auth-actions.ts` | Login/signup/logout server actions |
| `src/lib/wallet.ts` | Wallet generation + AES-256-GCM encryption for wallet storage |
| `src/lib/cdr.ts` / `src/lib/cdr-server.ts` | CDR client wrappers |
| `src/app/auth/callback/route.ts` | Server-side Google OAuth callback handler that exchanges the auth code and creates a profile if needed |
| `src/app/api/forms/route.ts` | Create new forms + list creator’s forms |
| `src/app/api/generate-form/route.ts` | AI form generation endpoint powered by Groq |
| `src/app/api/respond/route.ts` | Submit responses (encrypt via CDR) |
| `src/app/api/results/route.ts` | Decrypt + aggregate responses (creator only) |
| `src/app/forms/new/page.tsx` | Form builder UI |
| `src/components/AIFormGenerator.tsx` | Prompt-based AI form generation modal used inside the builder |
| `src/app/forms/[formId]/page.tsx` | Public survey page |
| `src/app/forms/[formId]/results/page.tsx` | Results dashboard |
| `src/app/dashboard/page.tsx` | Creator homepage |
| `src/components/Sidebar.tsx` | Sidebar + search modal |

---

## Future Ideas (Not Built Yet)
- Email confirmations for creators when new responses come in
- CSV export of decrypted results
- Form analytics (completion rate, time to finish)
- Custom domains for white-label surveys
- Question branching (conditional logic)
- Rate limiting to prevent spam
- More templates (already have a few!)
