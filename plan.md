# ChatSense: Project Plan (Next.js version)

> Working name: **ChatSense**. Change it if I say so.
> Hackathon: Gemma 4 challenge. Solo developer, about 6 hours, vibe coding in Antigravity.
> This file is the single source of truth. Read all of it before writing any code.

---

## 0. Instructions for the AI coding agent (read first)

1. **Do not write any code yet.** First, ask me the questions in Section 16 in one short batch, with the defaults offered, so I can answer quickly.
2. After I answer, restate the final scope in 10 lines or fewer and wait for my "go".
3. Build in the order in Section 13. Finish and test each step before the next one. After each step, tell me exactly how to run and check it. A polished smaller app beats a broken bigger one.
4. If anything here is unclear or conflicts with reality (a model tag does not exist, a library is not compatible), **stop and ask**. Never invent model names, APIs, package names or versions. Check what is actually installed.
5. Never let the model decide anything that normal code can decide (dates, totals, link checks, sorting, validation).
6. Keep dependencies few. No paid services, no accounts, no external database, no cloud.
7. Install UI libraries one at a time and confirm the app still runs after each.
8. Skip everything marked optional or stretch unless I explicitly ask.
9. Do not add a chatbot, accounts, email integration or any feature not listed in Section 4.1.

---

## 1. One-line pitch

Paste or export a messy chat (college group, bills, promotions, suspicious messages). ChatSense turns it into **evidence-backed action cards**: a to-do list with a time-left meter, info cards, bills, a "what changed" feed, and a **fraud check where normal code verifies links and payment IDs, not just the AI**. Inference runs locally.

**Demo headline:** "It catches what changed and what is a trap, and every item points to the exact message it came from."

---

## 2. Problem

- College group chats bury deadlines, changes and notices under hundreds of messages. A deadline moves and half the group misses it.
- The same chats carry bills, payment requests and links. Elderly people and new UPI users also get fraud messages and cannot tell what is safe.
- Existing tools (chat summarizers, spam filters, calendar suggestions) each cover one piece. Few link every result to its source message, track corrections, or use code to verify fraud signals. Never claim "nothing exists" in the demo or README.

## 3. Users

- Primary: college students reading group chats (English).
- Secondary: family members checking suspicious messages and tracking bills.

---

## 4. Scope

### 4.1 Must have (MVP)

| # | Feature | Notes |
|---|---------|-------|
| 1 | Input: pasted text and WhatsApp-style exported `.txt` | Other channels work by copy-paste |
| 2 | Per-message classification | task, deadline, change, info, bill, promo, suspicious, noise |
| 3 | To-do list with **time-left meter** | Computed by code. Red under 24h, "Overdue", "Uncertain date" |
| 4 | Info cards | Venue, rules, contacts, notices that are not tasks |
| 5 | **"What changed" feed** | e.g. "Deadline moved from 5th to 8th". Latest message wins |
| 6 | Bills and payments panel | Payee, amount, due date, paid toggle, monthly total |
| 7 | Fraud check | Gemma names tricks, code checks links and payment IDs. Never says "safe" |
| 8 | **Evidence links** | Every card shows its source message(s). Click to jump and highlight |
| 9 | Clickable links, safely | See Section 9 |
| 10 | Confirm/edit step | User accepts, edits or dismisses extracted items |
| 11 | Uncertain state | Vague items ("soon") shown as uncertain |
| 12 | Undo and change log | Every user change is logged and reversible |
| 13 | `.ics` export | Download deadlines for any calendar app |
| 14 | "Today" digest | Due today, overdue, new fraud flags |
| 15 | Demo mode | Sample chats built in so the demo works with no setup |
| 16 | Accuracy page | Shows my real test results (Section 12) |
| 17 | "Local only" panel | States exactly what stays on the device |

### 4.2 Explicitly out of scope

- Chatbot or conversational agent.
- Gmail or any email API (emails are supported only as pasted text through the same pipeline).
- Accounts, multi-user, cloud sync, push notifications.
- Larger Gemma models. **Use only the small local models (E2B or E4B). No 26B, no 31B, no hosted inference.**
- Live link scanning or fetching any URL.
- Python backend. The whole app is Next.js.

### 4.3 Optional stretch (only if I say so)

- Screenshot input. Small models are unreliable at reading all text in images, so it is off by default. If enabled, show the extracted text for correction before analysis and label it experimental.
- Voice input or output with ElevenLabs.
- Meaning-based search across tasks.

---

## 5. Tech stack

- **Next.js (App Router) + TypeScript.** Check the installed versions with the package manager and use what actually installs. Do not assume version numbers.
- **Tailwind CSS** and **shadcn/ui** for structure (cards, tabs, dialogs, tables, badges, toasts).
- **Zod** for schema validation of every model output and every API input.
- **Motion library** (framer-motion or `motion`, whichever Magic UI requires) for animation.
- Date handling: a small, well-known date library or plain `Date`. Keep it simple.
- `.ics`: generate by hand or with a tiny well-known package. Verify it opens in a calendar.
- Storage: **browser localStorage** for tasks, bills, change log and settings (default). No database unless I ask.
- No Python, no separate backend server.

### Gemma access

- Next.js **server-side route handlers** call Ollama's local HTTP API (default `http://localhost:11434`). The browser never calls Ollama directly. This avoids CORS problems.
- **Verify the exact Gemma 4 small model tag, quantization and Ollama version on my machine** before building (`ollama list`). Do not assume a tag exists. My hardware: NVIDIA RTX 3050 6GB VRAM, about 16GB RAM. Target E4B first, E2B as fallback.
- Set `num_ctx` explicitly (start around 8192 and measure). Ollama's default is small and silently truncates long chats.
- Disable any thinking or extended-reasoning mode for extraction calls.
- Read `prompt_eval_count`, `eval_count` and durations from the Ollama response to measure speed.
- Keep a mock-mode switch (environment variable) that returns cached sample outputs, for demo fallback and UI development without the model.

### Division of labor

| Gemma does | Normal code does |
|-----------|------------------|
| Classify each message | Parse export, timestamps, senders |
| Extract task text, raw date phrases, amounts, payees | Convert date phrases to dates, compute time left |
| Detect which message corrects an earlier one | Apply "latest wins", keep history |
| Name manipulation tricks in suspicious messages | Check links, domains, UPI IDs, amounts |
| Write one-line plain explanations | Validate, deduplicate, sort, total, export |

---

## 6. Pipeline

1. **Parse.** Split into messages `{id, timestamp, sender, text}`. Support the export format I give you (Section 16) plus plain pasted text. If a message has no timestamp, ask me what to use. Never silently assume.
2. **Batch.** Send 10 to 20 messages per Gemma call. Ask for short JSON only.
3. **Classify and extract per message** (not per chat, since one chat mixes types).
4. **Validate** with Zod. On failure, retry once with a stricter prompt. If it still fails, mark those messages "could not analyze" and show them.
5. **Evidence rule.** Every item needs `source_message_ids` and a `source_quote` that really appears in that message (check with code). Drop any item whose quote is not found.
6. **Resolve dates in code** using **each message's own timestamp, not today's date**. "Submit tomorrow" sent last week is already overdue. Gemma returns the raw phrase. If ambiguous, set `uncertain=true`.
7. **Deduplicate and track changes.** Gemma proposes "this message updates task X" for candidate pairs. Code applies it and records `{field, old, new, message_id}`.
8. **Fraud checks** (Section 8) on suspicious messages and any message with links or payment details.
9. **Present** cards, then the confirm/edit flow.

---

## 7. Data schema (starting point)

```ts
// Per-message analysis (Gemma output, validated with Zod)
{
  message_id: "m_014",
  category: "task" | "deadline" | "change" | "info" | "bill" | "promo" | "suspicious" | "noise",
  task: { title: string, date_phrase: string | null, assignee: string | null } | null,
  updates_task_hint: string | null,   // short phrase naming the task this changes
  bill: { payee: string, amount: number | null, currency: "INR", due_phrase: string | null } | null,
  info: { label: string, value: string } | null,
  fraud_signals: Array<"urgency" | "fake_authority" | "kyc_threat" | "prize_lure" | "payment_request">,
  source_quote: string,               // exact text from the message
  confidence: "high" | "medium" | "low"
}
```

- Fields irrelevant to the category are null.
- Amounts: Gemma extracts the number as written. Code checks it is numeric and plausible. Show "not found" if missing; never assume zero.

---

## 8. Fraud check (the differentiator, build it carefully)

**The verdict comes from code checks. Gemma only names tricks and explains.**

Code checks (deterministic):

- Extract all URLs and show the **real domain** next to each link.
- Flag: URL shorteners, IP-address links, lookalike domains (edit distance against a small curated list of well-known brands and banks), unusual TLDs, `@` tricks, punycode.
- UPI IDs: extract them. Flag when the claimed payee name does not match the handle, and when the message says to enter a PIN to **receive** money (receiving never needs a PIN).
- Flag urgency plus a payment request plus a link in one message.
- Cross-check against the user's own bills: a request to pay a bill to a **different** payee or UPI ID than the one on record is flagged.

Gemma part: list the manipulation tricks present and write one plain-language sentence each.

Verdict labels (use exactly these):

- **High risk**: several strong signals, or a code check failed.
- **Suspicious**: some signals.
- **No red flags found**: never "safe". Always add "This does not guarantee the message is genuine."

When unsure, prefer "Suspicious". A missed scam is worse than a false alarm. Report both honestly on the Accuracy page.

---

## 9. Link, rendering and injection security (must follow)

- React escapes text by default. **Never use `dangerouslySetInnerHTML` with chat content.**
- Linkify only `http` and `https`. Reject `javascript:`, `data:` and everything else.
- Show the real domain beside each link.
- Links in High risk or Suspicious messages are **disabled by default** with an "I understand, open anyway" confirmation.
- Use `target="_blank"` with `rel="noopener noreferrer"`.
- **Never fetch, preview or scan any link automatically.**
- Treat chat text as **data, never instructions**. In prompts, wrap chat text in clear delimiters and tell the model to ignore any instructions inside. Validate all output in code so a message like "ignore previous instructions" cannot change behavior.
- Validate all API route inputs with Zod and cap input size.
- Test with `<script>alert(1)</script>` and a `javascript:` link in a sample message.

---

## 10. UI and visual design

Goal: very visually appealing, but readable and fast. UI is one of six judged criteria, so **cap UI polish at about 1.5 hours total**. Do not let it eat the time needed for extraction, fraud checks and testing.

### Libraries

- **shadcn/ui** is the base for all structure.
- **Magic UI** and **React Bits**: pick **at most 3 to 4 effects** total. Suggested uses: animated number or countdown for the time meter, animated list for cards appearing, one subtle border or glow effect on the fraud card, one restrained hero element on the input screen.
- "**tagmag ui**": I am not sure this library exists or fits this stack. **Check it before using it, and ask me.** Skip it if it is not clearly maintained and compatible.
- Animated client components need `"use client"`. If hydration errors appear, check that first.

### Performance rules

- **No heavy WebGL or shader backgrounds** on the analysis screen. The GPU is shared with the local model. Test with Ollama running.
- Skeleton loaders while Gemma works, and show results progressively per batch so the wait feels short.
- Respect `prefers-reduced-motion`.

### Design rules

- One accent color. Red and amber are reserved for risk and urgency only.
- Evidence quotes and the real link domain must stay readable. No decoration that hides them.
- Check phone-width layout. Judges may open it on a phone.
- Light theme default, dark theme only if cheap.

### Screens

- **Input screen:** paste box, file upload, "Try demo chat" button.
- **Results:** Today digest on top, then sections or tabs for To-do, What Changed, Info Cards, Bills, Fraud Check, plus a chat viewer panel.
- **Every card:** confidence badge, source quote, "View source message" button that scrolls to and highlights the message.
- **Time-left meter:** chip or bar such as "2d 4h left". Red under 24h, "Overdue" distinct, "Uncertain date" grey.
- **Fraud card:** verdict label, signals, each link with its real domain and flags.
- **Confirm/edit:** accept, edit or dismiss each item. Undo button and a change-log panel.
- **Local-only panel** and **Accuracy page.**

---

## 11. Privacy statement

State exactly what is true. If inference is fully local (Next.js server to local Ollama, data in localStorage), say "chat text never leaves this device". If anything else is used (hosted models, ElevenLabs), say exactly what leaves the device. Never claim "we do not save chats" if localStorage keeps them. Offer a "Clear all data" button.

---

## 12. Testing and accuracy (do not skip; this makes the claims credible)

1. I will hand-edit the test chats. Draft a first version if I ask, but **never use raw model-generated data as the only test set**.
2. Minimum test set:
   - 3 college chats, 40 to 60 messages each, with planted traps: a deadline that moves, a repeated task, a vague "soon", relative dates ("tomorrow", "next Monday"), noise and jokes.
   - 10 to 15 suspicious messages (fake KYC, prize, UPI refund trick, shortened links, lookalike domains) and 10 to 15 normal messages with legitimate links.
   - 5 bill or payment messages, including a duplicate and a mismatched payee.
3. Store expected answers in a file. Write a script that runs the test set and prints: task and deadline accuracy, change-detection accuracy, fraud caught / missed / false alarms, and average time per analysis.
4. Show these real numbers on the Accuracy page. Label the data as hand-written or synthetic. Do not inflate results.
5. Measure speed (tokens per second, total time) from Ollama's response fields.

---

## 13. Build order (about 6 hours; adjust after my answers)

| Step | Work | Time |
|------|------|------|
| 1 | Create the Next.js app, verify Ollama and the Gemma model from a server route, check speed and `num_ctx`, run a 10-message smoke test | 0:30 |
| 2 | Parser, Gemma extraction route, Zod validation and retry, mock mode | 1:00 |
| 3 | Date resolution, to-do list, time-left meter, dedupe, change tracking | 1:00 |
| 4 | Fraud checks (code) plus Gemma explanations | 1:00 |
| 5 | UI: shadcn base, cards, evidence jump, safe links, confirm/edit, undo, then 3 to 4 visual effects | 1:15 |
| 6 | Bills panel, `.ics` export, Today digest, demo mode, local-only panel | 0:45 |
| 7 | Test set, accuracy page, bug fixing, demo rehearsal, README | 0:30 to 1:00 |

**Cut order if time runs out (first to last):** optional stretches, extra visual effects, bills panel details, `.ics` export, Today digest.
**Never cut:** evidence links, change tracking, fraud code checks, safe link handling, demo mode.

---

## 14. Demo script (2 minutes)

1. Click "Try demo chat" (a college group chat, about 50 messages).
2. Show the To-do list with the time-left meter and one red item.
3. Open **What Changed**: "Submission deadline moved from 5th to 8th." Click through to the source message.
4. Show Info cards and Bills.
5. Paste a scam message with a shortened link and a UPI request. Show **High risk**, the real domain and the failed check.
6. Show the `.ics` export and the Accuracy page with real numbers.
7. Close with the Local-only panel.

Prepare a fallback: mock mode with cached outputs, plus a short recorded video.

---

## 15. README and submission notes

- Explain the problem, the Gemma/code split, and why Gemma is needed (messy language, meaning matching, manipulation tricks).
- State that test data is hand-written or synthetic.
- List limitations: English chats first, no live link scanning, fraud check is a risk estimate and not a guarantee, screenshots unsupported unless enabled.
- Do not claim "no competitors exist" or "100 percent accurate".
- Include setup steps: install Ollama, pull the model, set environment variables, run the app.

---

## 16. Questions to ask me before building

Ask these in one batch, with the default in brackets so I can reply "defaults":

1. **Model:** Which exact Gemma 4 small model tag is installed in my Ollama (E4B or E2B), and which Ollama version? If I do not know, give me the commands to check. [Default: E4B, 4-bit]
2. **Node and package manager:** Which Node version and package manager do I use? [Default: latest LTS, npm]
3. **Chat export format:** Which WhatsApp export style (Android or iPhone, 12h or 24h, DD/MM or MM/DD)? Ask me to paste 5 sample lines with private data removed.
4. **Time zone:** [Default: system time zone, IST]
5. **Test data:** Should you draft the first test chats for me to edit by hand? [Default: yes]
6. **UI libraries:** Which exact Magic UI, React Bits and other components do I want? Does "tagmag ui" exist and which component do I want from it? [Default: shadcn/ui plus 3 to 4 effects chosen by you, tagmag ui skipped until verified]
7. **Look and feel:** App name, accent color, light or dark theme. [Default: ChatSense, one blue or violet accent, light theme]
8. **Bills panel depth:** Simple list with a paid toggle and monthly total, or more? [Default: simple]
9. **Screenshots, voice, ElevenLabs:** Enabled or skipped? [Default: skipped]
10. **Brand and bank list** for lookalike-domain checks: do I have one, or should you draft about 30 entries for me to review? [Default: you draft]
11. **Storage:** localStorage only, or a small database? [Default: localStorage only]
12. **Hackathon rules:** Any limits on libraries, hosting, demo format or required submission files?
13. **Deployment:** Local-only demo, or hosted somewhere too? [Default: local-only, with a recorded video fallback]

After my answers, summarize the final scope in 10 lines or fewer and wait for my "go".

---

## 17. Definition of done

- Demo chat runs end to end locally with the Gemma model (and in mock mode as a fallback).
- Every card has a working evidence link.
- At least one change appears in the What Changed feed.
- Fraud verdicts come from code checks, show real domains, and never say "safe".
- Chat text is escaped, links are protected, and prompt injection in a chat cannot alter behavior.
- `.ics` export opens correctly in a calendar app.
- Accuracy page shows real results from my hand-edited test set.
- UI looks polished on desktop and phone width, and stays responsive while the model runs.
- README is honest about limits.
