# Nova Café — Review Generation & Customer Feedback Manager

A completely free, self-contained demo of a review-generation and reputation-management
system for a fictional coffee shop, **Nova Café**. Built as a portfolio piece to show
what an AI-styled reputation platform looks and feels like — with zero paid APIs.

**Live demo:** deployed via GitHub Pages (see repo settings for the URL).

## What this is

- 100% client-side: HTML, CSS, and vanilla JavaScript only.
- Data is stored in the browser's `localStorage` — no backend, no database, no server.
- No paid APIs of any kind: no Google Business Profile API, no SMS API, no WhatsApp
  Business API, no paid automation tool, no external AI API.
- "AI-style" feedback analysis is done **locally** with deterministic keyword matching —
  not a real machine-learning model, but demonstrates the concept end-to-end.

## Customer flow (`Customer Simulator` tab)

1. The business "sends" a review request after an order (`Review Requests` tab).
2. The customer opens their simulated review link and is asked: **"How was your
   experience?"** with a 1–5 star rating.
3. **4–5 stars:** shown "We're glad you enjoyed your experience!" and then offered the
   choice to leave a public review, with configurable placeholder links (Google,
   Instagram, TripAdvisor — edit these in `Settings`).
4. **1–3 stars:** shown "We're sorry your experience wasn't perfect. We'd love to
   understand what happened," and asked for private feedback that goes straight to the
   business — never posted publicly.

Importantly, **negative feedback is never hidden or discarded**. Every rating —
positive or negative — is saved and shown in the Admin dashboard. The goal of the flow
is to route happy customers toward public reviews and unhappy customers toward a private
channel where the business can actually fix the problem — not to manipulate the public
review count.

## Admin dashboard (`Dashboard`, `Feedback Inbox`, `Review Requests` tabs)

- Total reviews, average rating, positive/negative counts
- Feedback requiring a response, review requests sent, and review completion rate
- Feedback broken down by category: **Service, Staff, Price, Quality, Waiting time,
  Cleanliness** — detected automatically from the written text via local keyword
  scanning (see `CATEGORY_KEYWORDS` in `script.js`)
- A **"Generate Response"** button on any piece of feedback drafts a professional reply
  locally, using a template bank keyed by detected category and sentiment (positive /
  neutral / negative) — fully editable before saving
- Sample feedback and sample review requests are pre-loaded so the demo looks realistic
  immediately (`Reset Demo Data` restores this sample data at any time)

## Files

- `index.html` — page structure and all views (dashboard, inbox, requests, simulator, settings)
- `styles.css` — visual design, styled like a SaaS reputation-management product
- `script.js` — data model, category detection, response templates, rendering logic
- `README.md` — this file

## Connecting real services later

This demo is intentionally built with zero dependencies so it's free to host and run
anywhere. When a real client is ready to go live, each simulated piece has a natural
real-world upgrade path:

| Demo feature | Real-world upgrade |
|---|---|
| Simulated review request | **WhatsApp Business API** or **Twilio SMS** to send real review links |
| Public review link placeholders | **Google Business Profile API** to read/post real Google reviews |
| Local keyword category detection | A real **LLM API** (e.g. the Claude API) for more nuanced sentiment & category analysis |
| Local response template generator | An **LLM API** to draft fully custom, context-aware responses |
| `localStorage` data | A real database (e.g. **Supabase** or **Firebase**) so data persists across devices/browsers |

## Running locally

No build step required. Just open `index.html` in a browser, or serve the folder with
any static file server (e.g. GitHub Pages, `python3 -m http.server`, etc).
