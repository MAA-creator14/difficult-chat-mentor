# Product Requirements Document: Difficult Chat Mentor

**Version:** 1.0
**Date:** 2026-04-10
**Status:** Draft

---

## 1. Overview

### Problem Statement

Most managers know they need to have a difficult conversation. Few feel prepared to have it well. The stakes are high — an awkward performance conversation can damage trust, a poorly framed termination can create legal exposure, and a fumbled feedback session can entrench the exact behavior it was meant to change.

There are plenty of frameworks (SBI, COIN, STAR, radical candor) and books on the topic, but no lightweight, private tool that helps a manager *actually prepare* for a specific conversation happening *this week*.

### Product Vision

**Difficult Chat Mentor** is an AI-powered PWA that acts as a private thinking partner for managers preparing for hard conversations. It guides them through structured preparation, sharpens their talking points with AI coaching, and lets them practice the conversation before the real thing — all stored locally on their device with no account required.

### One-liner

> A private AI coach in your pocket that turns dread into confidence before your toughest management conversations.

---

## 2. Goals & Non-Goals

### Goals (v1)

- Help managers structure their thinking before a difficult conversation using proven frameworks
- Surface AI-generated coaching that improves clarity, tone, and completeness of talking points
- Let managers practice the conversation through AI role-play that simulates realistic employee responses
- Store all prep sessions locally so managers can return to, update, and close out their notes
- Work offline and be installable as a PWA on desktop and mobile

### Non-Goals (v1)

- No backend, no user accounts, no cloud sync — all data stays on the device
- No HR admin dashboard, team-level reporting, or multi-user features
- No calendar integration, meeting scheduling, or notification system
- No audio/video recording or transcription
- No sharing or exporting to HR systems
- No real-time coaching during the actual conversation

---

## 3. Target Users & Jobs to Be Done

### Primary User: The People Manager

A manager who directly oversees individual contributors. They may be a first-time manager or a seasoned leader; what they have in common is a difficult conversation coming up — one they're anxious about, want to get right, and don't want to wing.

**Characteristics:**
- Has 1–10 direct reports
- Works at a company with no (or minimal) manager coaching support available on demand
- Values privacy — does not want to expose employee details to HR or their own manager before the conversation
- Short on time — needs to prep in 20–40 minutes, not over several sessions

### Primary Job to Be Done

> "When I have a tough conversation coming up with someone on my team, I want a structured way to prepare and practice so that I walk in feeling clear, confident, and fair — not reactive."

### Secondary Jobs

- "Help me find the right words so I'm direct without being harsh."
- "Let me test how this person might react before I'm in the room with them."
- "Keep a record of what I planned to say so I can compare it to what actually happened."

---

## 4. Conversation Types

The app supports the following conversation categories, each with tailored guidance:

| Category | Examples |
|---|---|
| **Performance concerns** | Missing targets, quality issues, attendance, attitude |
| **Critical / corrective feedback** | One-off behavior that must change |
| **Performance Improvement Plan (PIP)** | Formal PIP initiation or check-in |
| **Termination** | Letting someone go for performance or role elimination |
| **Compensation denial** | Declining a raise or promotion request |
| **Role or scope change** | Reassigning responsibilities, demotion, reorg impact |
| **Conflict between reports** | Addressing interpersonal tension that affects the team |
| **Sensitive personal matters** | Hygiene, mental health concerns, accommodations |

Each type surfaces relevant frameworks, legal cautions, and role-play personas calibrated to that scenario.

---

## 5. Core Features

### 5.1 Guided Prep Wizard

A step-by-step structured preparation flow that adapts to the conversation type selected.

**Flow:**

1. **Choose conversation type** — select from the supported categories above
2. **Set the context** — describe the situation in plain language (what happened, when, pattern vs. one-off)
3. **Behavior & impact** — what specific behavior needs to change, and what impact has it had on the team/business (SBI framework)
4. **Desired outcome** — what does success look like after this conversation? (mutual understanding, agreed action, formal warning, etc.)
5. **Anticipate objections** — what pushback, deflection, or emotional reaction is the manager expecting? The app prompts with common reactions for the selected conversation type.
6. **Draft talking points** — the manager writes their key messages; the AI coaching layer reviews these in real time
7. **Pre-flight checklist** — context-specific reminders (e.g., "have you documented previous feedback?", "is HR looped in for a termination?")

**Frameworks surfaced by conversation type:**
- **SBI** (Situation-Behavior-Impact) — default for feedback and performance
- **COIN** (Context-Observation-Impact-Next Steps) — corrective conversations
- **SCARF** (Status-Certainty-Autonomy-Relatedness-Fairness) — for sensitive/emotional conversations
- Termination-specific checklist aligned to employment law best practices

### 5.2 AI Coaching

Powered by the Claude API. Runs inline during prep wizard and available on demand.

**Capabilities:**

- **Review talking points** — identifies vague, judgmental, or aggressive language; suggests more precise alternatives
- **Legal flag** — flags language that could be construed as discriminatory, retaliatory, or inconsistent with an at-will employment relationship (with a disclaimer to consult HR/legal)
- **Completeness check** — surfaces what's missing ("you haven't described the specific behavior, only the outcome")
- **Tone calibration** — on a spectrum from "direct" to "compassionate," the manager can ask the AI to adjust the register of their talking points
- **Strengthen or soften** — single-click variants: make this firmer / make this kinder
- **Suggest openers** — generate 2–3 opening lines calibrated to the conversation type and context

**Implementation note:** AI calls go directly from the client to the Anthropic API. The user must supply their own API key (stored in localStorage). A clear notice reminds users not to include the employee's full name or other identifying PII in their prep notes.

### 5.3 AI Role-Play Practice

After completing the prep wizard, the manager can enter a practice session before the real conversation.

**How it works:**

1. The manager clicks "Practice this conversation"
2. The AI loads as the simulated employee — its persona is calibrated from the conversation type, the anticipated objections the manager described, and common psychological patterns for that scenario
3. The manager opens the conversation (typed); the AI responds as the employee would
4. The AI can react with: denial, defensiveness, sadness, agreement, deflection, or genuine curiosity — varying across the session realistically
5. The manager can type `/coach` at any point to pause the simulation and ask the AI coach for real-time guidance ("how should I respond to that deflection?")
6. At the end of the session, the AI provides a **debrief**: what went well, where the manager could sharpen their approach, key moments to watch for in the real conversation

**Practice session is saved** as part of the conversation record (summary only, not full transcript, to manage storage).

### 5.4 Notes & Conversation History

All prep sessions are saved locally via IndexedDB.

**Home screen:** list of conversations, sorted by date, with status badges:
- `Preparing` — wizard not yet complete
- `Ready` — prep complete, practice done (or skipped)
- `Happened` — manager marked it as completed
- `Archived`

**Conversation detail:**
- View and edit prep notes at any time
- Add post-conversation reflection ("how did it actually go?")
- Mark as complete with optional outcome note
- Delete conversation (with confirmation)

**Search:** full-text search across conversation notes (client-side).

---

## 6. PWA Requirements

| Requirement | Spec |
|---|---|
| Installable | Web app manifest with icons; install prompt on supported browsers |
| Offline capable | Service worker caches app shell; prep wizard and existing notes work fully offline |
| Responsive | Designed mobile-first; fully usable on desktop, tablet, and mobile |
| Home screen icon | App icon at 192×192 and 512×512 |
| No app store required | Distributable as a URL; installable via browser |

**Offline behavior:** The guided prep wizard and notes work fully offline. AI coaching and role-play require an internet connection; the UI gracefully degrades and notifies the user when offline.

---

## 7. Tech Stack Recommendation

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React + Next.js | Fast build, great PWA plugin ecosystem |
| PWA plugin | `vite-plugin-pwa` (Workbox) | Service worker + manifest generation |
| Styling | Tailwind CSS | Fast iteration, responsive utilities |
| Language | Typescripy
| Local storage | IndexedDB via `idb` library | Structured data, handles conversation history at scale |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) | Best-in-class conversational coaching; streaming support for real-time feedback |
| API key mgmt | User-supplied key stored in localStorage | No backend required; user controls their own key |
| State management | React Context + `useReducer` | Sufficient for this app's complexity; no Redux needed |
| Routing | React Router v6 | SPA routing for wizard steps and conversation views |

---

## 8. UX / Information Architecture

```
Home
├── Conversation list (sorted by status, then date)
│   ├── [status badge] Conversation title + type
│   └── Last modified date
├── + New Conversation (CTA)
└── Settings (API key, theme)

New Conversation Flow
├── Step 1: Choose conversation type
├── Step 2: Context
├── Step 3: Behavior & Impact (SBI)
├── Step 4: Desired Outcome
├── Step 5: Anticipate Objections
├── Step 6: Talking Points + AI Coaching panel
├── Step 7: Pre-flight Checklist
└── → Practice or Save & Go

Practice Session
├── Role-play chat interface
├── /coach interrupt mode
└── End session → Debrief view

Conversation Detail
├── Prep notes (editable)
├── Practice debrief (read-only)
├── Post-conversation reflection (editable)
└── Status controls (Mark as happened / Archive / Delete)
```

### Key UX principles

- **Private by default**: no splash screen prompts for sign-up; the app opens directly to the conversation list
- **Progress preservation**: every keystroke auto-saves; no data loss on accidental close
- **Anxiety-aware design**: calm, neutral color palette; avoid red/warning-heavy UI that amplifies stress
- **Jargon-free**: frameworks (SBI, COIN) are explained inline on first use; never assumed knowledge

---

## 9. Privacy & Data

- **No data leaves the device** except AI coaching calls sent to the Anthropic API
- **Anthropic API calls** contain only the manager's prep notes — no employee name, HR system identifiers, or company name is required or requested
- **In-app notice** on first AI use: "Your notes are sent to Claude to generate coaching. Don't include this employee's full name, ID, or sensitive personal information."
- **No analytics, no telemetry, no crash reporting** in v1
- **Data deletion**: clearing app storage in the browser permanently deletes all conversations; the Settings screen surfaces a "Delete all data" option
- **API key**: stored in localStorage, never transmitted anywhere except directly to `api.anthropic.com`

---

## 10. Success Metrics

Since the app has no backend, metrics are qualitative or self-reported in v1.

| Metric | How to measure |
|---|---|
| Wizard completion rate | Client-side event (IndexedDB: % of started conversations that reach "Ready" status) |
| Role-play adoption | % of completed prep sessions that include a practice run |
| Return usage | Conversations with a "Post-conversation reflection" filled in |
| Confidence delta | Optional 1–5 pre/post confidence rating at wizard start and end |
| NPS / qualitative | Optional thumbs up/down on AI coaching suggestions (stored locally) |

---

## 11. Out of Scope — v1

The following are explicitly deferred to future versions:

- Cloud sync and cross-device access
- User accounts and authentication
- HR admin or manager-of-managers dashboard
- Team-level analytics or aggregated insights
- Integration with HRIS, performance management, or calendar systems
- Audio/video recording or real-time transcription
- Sharing prep notes with HR or a skip-level
- Mobile native apps (iOS/Android)
- Localization / multi-language support

---

## 12. Open Questions

1. **API key UX**: Should the app prompt for the Anthropic API key on first launch, or only when the user first tries to use an AI feature? (Recommended: on first AI feature use, with a clear explanation of why it's needed.)
2. **Conversation naming**: Should conversation "titles" be auto-generated from context ("Performance feedback — Jan 2026") or always user-defined?
3. **Role-play persona depth**: How much detail should the manager provide about the employee's likely personality/reaction style? More input = better simulation but more friction.
4. **Termination flow**: Should termination conversations have a stricter "consult HR first" gate, or trust the manager to have done that?
