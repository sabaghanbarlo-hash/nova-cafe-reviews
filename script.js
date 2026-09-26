/* ============================================================
   Nova Café — Reputation & Feedback Manager
   100% client-side demo. No paid APIs. Data lives in localStorage.
   ============================================================ */

const STORAGE_KEY = 'novaCafe_feedback_v1';
const REQUESTS_KEY = 'novaCafe_requests_v1';
const SETTINGS_KEY = 'novaCafe_settings_v1';

/* ---------------- Category keyword dictionary ----------------
   This is the "local AI-style" analysis: no external API call,
   just deterministic keyword scoring. */
const CATEGORY_KEYWORDS = {
  'Service': ['service', 'server', 'waiter', 'waitress', 'attentive', 'friendly', 'rude', 'helpful', 'ignored', 'greeted'],
  'Staff': ['staff', 'employee', 'barista', 'cashier', 'manager', 'team', 'crew'],
  'Price': ['price', 'expensive', 'cheap', 'cost', 'value', 'overpriced', 'affordable', 'pricy', 'pricey'],
  'Quality': ['quality', 'taste', 'delicious', 'fresh', 'stale', 'coffee', 'espresso', 'flavor', 'flavour', 'food', 'pastry', 'bland', 'burnt', 'cold food'],
  'Waiting time': ['wait', 'waiting', 'slow', 'queue', 'line', 'quick', 'fast', 'delay', 'forever', 'long time'],
  'Cleanliness': ['clean', 'dirty', 'mess', 'hygiene', 'sanitary', 'spotless', 'sticky', 'dusty', 'bathroom', 'restroom']
};

const RESPONSE_TEMPLATES = {
  positive: {
    default: "Thank you so much, {name}! We're thrilled you had a great experience at Nova Café on {date}. We can't wait to welcome you back soon. ☕",
    'Service': "Thank you, {name}! We're so glad our team made your visit on {date} a great one — we'll be sure to pass along the kind words.",
    'Staff': "Thanks for the shoutout, {name}! Our team works hard to make every visit feel welcoming, and we're happy it showed on {date}.",
    'Price': "Thanks, {name}! We're glad you felt you got great value during your visit on {date}. See you again soon!",
    'Quality': "Thank you, {name}! We're delighted you enjoyed the food and drinks on {date} — that means a lot to our kitchen and baristas.",
    'Waiting time': "Thanks, {name}! Glad we could get you served quickly on {date}. We aim to keep it that way!",
    'Cleanliness': "Thank you, {name}! We take pride in keeping Nova Café spotless, so it's great to hear that stood out on {date}."
  },
  neutral: {
    default: "Thank you for the honest feedback, {name}. We're always looking to improve, and we'd love to hear more about your visit on {date} if you're open to it.",
    'Service': "Thanks for letting us know, {name}. We're working on making our service more consistent — sorry it wasn't perfect on {date}.",
    'Staff': "We appreciate you sharing this, {name}. We'll pass this along to our team so we can keep improving after your visit on {date}.",
    'Price': "Thanks for the feedback, {name}. We're always reviewing our pricing to make sure it reflects the experience we want to offer.",
    'Quality': "Thank you, {name}. We're sorry the food or drinks didn't fully hit the mark on {date} — we'll share this with our kitchen team.",
    'Waiting time': "Thanks for your patience, {name}. We know the wait on {date} wasn't ideal, and we're working on speeding things up during busy hours.",
    'Cleanliness': "Thank you for flagging this, {name}. We'll make sure our cleaning routine gets another look after your visit on {date}."
  },
  negative: {
    default: "We're truly sorry your experience on {date} wasn't what it should have been, {name}. Thank you for telling us — we'd love the chance to make it right. Please reach out to us directly so we can follow up personally.",
    'Service': "We're sorry to hear the service fell short on {date}, {name}. That's not the standard we hold ourselves to, and we're addressing it with our team directly. We'd welcome the chance to make it right.",
    'Staff': "We sincerely apologize, {name}. Your feedback about our staff on {date} is being taken seriously and shared with our management team. We'd like the opportunity to make this right.",
    'Price': "We're sorry you felt the price didn't match the experience on {date}, {name}. We appreciate you telling us, and we'll take this into account as we review our offerings.",
    'Quality': "We're sorry the food or drinks didn't meet expectations on {date}, {name}. That's disappointing to hear, and we're sharing this directly with our kitchen team so it doesn't happen again.",
    'Waiting time': "We apologize for the long wait on {date}, {name}. That's not the experience we want for our customers, and we're actively working on improving speed during busy periods.",
    'Cleanliness': "We're very sorry to hear this, {name}. Cleanliness is a top priority for us, and we're addressing this with our team immediately following your visit on {date}."
  }
};

/* ---------------- Utilities ---------------- */

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function starString(rating, max = 5) {
  return '★'.repeat(rating) + '☆'.repeat(max - rating);
}

function sentimentFromRating(rating) {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

function detectCategories(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const scores = [];
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) count++;
    }
    if (count > 0) scores.push({ category, count });
  }
  scores.sort((a, b) => b.count - a.count);
  return scores.map(s => s.category);
}

function generateResponse(feedback) {
  const sentiment = sentimentFromRating(feedback.rating);
  const primaryCategory = feedback.categories && feedback.categories.length ? feedback.categories[0] : 'default';
  const bank = RESPONSE_TEMPLATES[sentiment];
  const template = bank[primaryCategory] || bank.default;
  return template
    .replace('{name}', feedback.customerName || 'there')
    .replace('{date}', formatDate(feedback.date));
}

/* ---------------- Storage layer ---------------- */

function loadFeedback() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) { return []; }
}
function saveFeedback(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadRequests() {
  try {
    return JSON.parse(localStorage.getItem(REQUESTS_KEY)) || [];
  } catch (e) { return []; }
}
function saveRequests(list) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || defaultSettings();
  } catch (e) { return defaultSettings(); }
}
function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
function defaultSettings() {
  return {
    google: 'https://g.page/r/nova-cafe-demo/review',
    instagram: 'https://instagram.com/novacafe.demo',
    tripadvisor: 'https://tripadvisor.com/nova-cafe-demo'
  };
}

/* ---------------- Seed sample data ---------------- */

function seedIfEmpty() {
  if (localStorage.getItem(STORAGE_KEY) !== null) return;

  const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString();

  const sampleFeedback = [
    {
      id: uid(), customerName: 'Elena Marks', orderService: 'Flat White + Almond Croissant',
      date: daysAgo(1), rating: 5, isPublic: true, feedbackText: 'The staff were so friendly and the coffee was fantastic as always!',
      status: 'No Response Needed', response: null
    },
    {
      id: uid(), customerName: 'Tom Reyes', orderService: 'Iced Latte',
      date: daysAgo(2), rating: 2, isPublic: false, feedbackText: 'I waited almost 20 minutes just for an iced latte, way too slow during lunch rush.',
      status: 'Needs Response', response: null
    },
    {
      id: uid(), customerName: 'Priya Nair', orderService: 'Cappuccino + Carrot Cake',
      date: daysAgo(3), rating: 4, isPublic: true, feedbackText: 'Great quality cake, though the price felt a little high for the portion size.',
      status: 'No Response Needed', response: null
    },
    {
      id: uid(), customerName: 'Jake Foster', orderService: 'Cold Brew',
      date: daysAgo(4), rating: 1, isPublic: false, feedbackText: 'The table and counter area were dirty and sticky, and no one cleaned it the whole time I was there.',
      status: 'Needs Response', response: null
    },
    {
      id: uid(), customerName: 'Mina Kobayashi', orderService: 'Matcha Latte',
      date: daysAgo(5), rating: 3, isPublic: false, feedbackText: 'The barista seemed new and got my order wrong twice. Not a bad visit overall, just a bit slow.',
      status: 'Needs Response', response: null
    },
    {
      id: uid(), customerName: 'Sam O\'Connell', orderService: 'Espresso + Croissant',
      date: daysAgo(6), rating: 5, isPublic: true, feedbackText: 'Best espresso in the neighborhood, hands down. Clean space, quick service, lovely staff.',
      status: 'No Response Needed', response: null
    },
    {
      id: uid(), customerName: 'Grace Liu', orderService: 'Chai Latte',
      date: daysAgo(8), rating: 2, isPublic: false, feedbackText: 'Overpriced for what it is, and the staff didn\'t seem very attentive.',
      status: 'Responded',
      response: "We're sorry to hear the service fell short, Grace. That's not the standard we hold ourselves to, and we're addressing it with our team directly. We'd welcome the chance to make it right."
    }
  ];

  sampleFeedback.forEach(f => {
    f.categories = detectCategories(f.feedbackText);
  });

  saveFeedback(sampleFeedback);

  const sampleRequests = [
    { id: uid(), customerName: 'Alex Chen', orderService: 'Oat Milk Latte', dateSent: daysAgo(0), status: 'Pending' },
    { id: uid(), customerName: 'Devon Brooks', orderService: 'Americano + Muffin', dateSent: daysAgo(0), status: 'Pending' },
    { id: uid(), customerName: 'Elena Marks', orderService: 'Flat White + Almond Croissant', dateSent: daysAgo(1), status: 'Completed' },
    { id: uid(), customerName: 'Tom Reyes', orderService: 'Iced Latte', dateSent: daysAgo(2), status: 'Completed' },
    { id: uid(), customerName: 'Priya Nair', orderService: 'Cappuccino + Carrot Cake', dateSent: daysAgo(3), status: 'Completed' },
    { id: uid(), customerName: 'Jake Foster', orderService: 'Cold Brew', dateSent: daysAgo(4), status: 'Completed' },
    { id: uid(), customerName: 'Mina Kobayashi', orderService: 'Matcha Latte', dateSent: daysAgo(5), status: 'Completed' },
    { id: uid(), customerName: 'Sam O\'Connell', orderService: 'Espresso + Croissant', dateSent: daysAgo(6), status: 'Completed' },
    { id: uid(), customerName: 'Grace Liu', orderService: 'Chai Latte', dateSent: daysAgo(8), status: 'Completed' },
    { id: uid(), customerName: 'Noah Patel', orderService: 'Drip Coffee', dateSent: daysAgo(9), status: 'Ignored' }
  ];
  saveRequests(sampleRequests);

  if (localStorage.getItem(SETTINGS_KEY) === null) {
    saveSettings(defaultSettings());
  }
}

/* ---------------- Navigation ---------------- */

function initNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('view-' + btn.dataset.view).classList.add('active');
      if (btn.dataset.view === 'dashboard') renderDashboard();
      if (btn.dataset.view === 'inbox') renderInbox();
      if (btn.dataset.view === 'requests') renderRequests();
      if (btn.dataset.view === 'simulator') renderSimulator();
      if (btn.dataset.view === 'settings') renderSettings();
    });
  });
}

/* ---------------- Dashboard ---------------- */

function computeStats() {
  const feedback = loadFeedback();
  const requests = loadRequests();

  const total = feedback.length;
  const avg = total ? (feedback.reduce((s, f) => s + f.rating, 0) / total) : 0;
  const positive = feedback.filter(f => f.rating >= 4).length;
  const negative = feedback.filter(f => f.rating <= 2).length;
  const needsResponse = feedback.filter(f => f.status === 'Needs Response').length;

  const sent = requests.length;
  const completed = requests.filter(r => r.status === 'Completed').length;
  const completionRate = sent ? Math.round((completed / sent) * 100) : 0;

  return { total, avg, positive, negative, needsResponse, sent, completed, completionRate };
}

function renderDashboard() {
  const s = computeStats();
  const grid = document.getElementById('stat-grid');
  grid.innerHTML = `
    <div class="stat-card">
      <div class="label">Total Reviews</div>
      <div class="value">${s.total}</div>
      <div class="sub muted">All-time collected feedback</div>
    </div>
    <div class="stat-card">
      <div class="label">Average Rating</div>
      <div class="value">${s.avg.toFixed(1)} <span style="font-size:1rem;color:var(--accent)">★</span></div>
      <div class="sub muted">Out of 5 stars</div>
    </div>
    <div class="stat-card">
      <div class="label">Positive Feedback</div>
      <div class="value">${s.positive}</div>
      <div class="sub pos">4–5 star reviews</div>
    </div>
    <div class="stat-card">
      <div class="label">Negative Feedback</div>
      <div class="value">${s.negative}</div>
      <div class="sub neg">1–2 star reviews</div>
    </div>
    <div class="stat-card">
      <div class="label">Needs a Response</div>
      <div class="value">${s.needsResponse}</div>
      <div class="sub ${s.needsResponse > 0 ? 'neg' : 'muted'}">Awaiting a reply</div>
    </div>
    <div class="stat-card">
      <div class="label">Review Requests Sent</div>
      <div class="value">${s.sent}</div>
      <div class="sub muted">Simulated to customers</div>
    </div>
    <div class="stat-card">
      <div class="label">Review Completion Rate</div>
      <div class="value">${s.completionRate}%</div>
      <div class="sub muted">${s.completed} of ${s.sent} completed</div>
    </div>
    <div class="stat-card">
      <div class="label">Public Reviews</div>
      <div class="value">${loadFeedback().filter(f => f.isPublic).length}</div>
      <div class="sub muted">Marked "would post publicly"</div>
    </div>
  `;

  renderCategoryBars();
  renderNeedsResponseList();
  renderRecentFeedback();
}

function renderCategoryBars() {
  const feedback = loadFeedback();
  const counts = {};
  Object.keys(CATEGORY_KEYWORDS).forEach(c => counts[c] = 0);
  feedback.forEach(f => (f.categories || []).forEach(c => { if (counts[c] !== undefined) counts[c]++; }));
  const max = Math.max(1, ...Object.values(counts));

  const el = document.getElementById('category-bars');
  el.innerHTML = Object.entries(counts).map(([cat, count]) => `
    <div class="category-row">
      <span>${cat}</span>
      <div class="category-track"><div class="category-fill" style="width:${(count / max) * 100}%"></div></div>
      <span>${count}</span>
    </div>
  `).join('');
}

function renderNeedsResponseList() {
  const feedback = loadFeedback().filter(f => f.status === 'Needs Response');
  const el = document.getElementById('needs-response-list');
  if (!feedback.length) {
    el.innerHTML = `<div class="mini-empty">🎉 Nothing pending — every review has a response.</div>`;
    return;
  }
  el.innerHTML = feedback.slice(0, 5).map(f => `
    <div class="mini-item">
      <div>
        <div class="mname">${f.customerName}</div>
        <div class="muted small">${starString(f.rating)} · ${formatDate(f.date)}</div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="openFeedbackModal('${f.id}')">Review</button>
    </div>
  `).join('');
}

function renderRecentFeedback() {
  const feedback = [...loadFeedback()].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const el = document.getElementById('recent-feedback');
  el.innerHTML = feedback.map(f => feedbackRowHtml(f)).join('');
}

function statusBadge(status) {
  const map = {
    'Needs Response': 'badge-needs',
    'Responded': 'badge-responded',
    'No Response Needed': 'badge-none'
  };
  return `<span class="badge ${map[status] || 'badge-none'}">${status}</span>`;
}

function sentimentBadge(rating) {
  const s = sentimentFromRating(rating);
  const map = { positive: 'badge-positive', neutral: 'badge-neutral', negative: 'badge-negative' };
  const label = { positive: 'Positive', neutral: 'Neutral', negative: 'Negative' };
  return `<span class="badge ${map[s]}">${label[s]}</span>`;
}

function feedbackRowHtml(f) {
  return `
    <div class="feedback-row" onclick="openFeedbackModal('${f.id}')" style="cursor:pointer">
      <div>
        <div class="fname">${f.customerName} <span class="muted small">— ${f.orderService}</span></div>
        <div class="fsnippet">${(f.feedbackText || '').slice(0, 90)}${(f.feedbackText || '').length > 90 ? '…' : ''}</div>
      </div>
      <div class="stars">${starString(f.rating)}</div>
      <div>${sentimentBadge(f.rating)}</div>
      <div>${statusBadge(f.status)}</div>
    </div>
  `;
}

/* ---------------- Inbox ---------------- */

function renderInbox() {
  const ratingFilter = document.getElementById('filter-rating').value;
  const categoryFilter = document.getElementById('filter-category').value;
  const statusFilter = document.getElementById('filter-status').value;

  let feedback = [...loadFeedback()].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (ratingFilter !== 'all') feedback = feedback.filter(f => f.rating === Number(ratingFilter));
  if (categoryFilter !== 'all') feedback = feedback.filter(f => (f.categories || []).includes(categoryFilter));
  if (statusFilter !== 'all') feedback = feedback.filter(f => f.status === statusFilter);

  const el = document.getElementById('inbox-list');
  if (!feedback.length) {
    el.innerHTML = `<div class="mini-empty">No feedback matches these filters.</div>`;
    return;
  }

  el.innerHTML = feedback.map(f => `
    <div class="inbox-card" onclick="openFeedbackModal('${f.id}')">
      <div class="inbox-card-top">
        <div>
          <div class="inbox-card-name">${f.customerName}</div>
          <div class="inbox-card-meta">${f.orderService} · ${formatDate(f.date)} · ${f.isPublic ? 'Public review' : 'Private feedback'}</div>
        </div>
        <div style="text-align:right">
          <div class="stars">${starString(f.rating)}</div>
        </div>
      </div>
      <div class="inbox-card-text">${f.feedbackText || '<em>No written comment.</em>'}</div>
      <div class="inbox-card-tags">
        ${sentimentBadge(f.rating)}
        ${statusBadge(f.status)}
        ${(f.categories || []).map(c => `<span class="detected-tag">${c}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function initInboxFilters() {
  ['filter-rating', 'filter-category', 'filter-status'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderInbox);
  });
}

/* ---------------- Feedback Modal ---------------- */

window.openFeedbackModal = function (id) {
  const feedback = loadFeedback();
  const f = feedback.find(x => x.id === id);
  if (!f) return;

  const backdrop = document.getElementById('modal-backdrop');
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h2>${f.customerName}</h2>
    <div class="modal-meta">${f.orderService} · ${formatDate(f.date)} · ${f.isPublic ? 'Would post publicly' : 'Private feedback only'}</div>
    <div class="stars" style="font-size:1.2rem">${starString(f.rating)}</div>
    ${sentimentBadge(f.rating)} ${statusBadge(f.status)}

    <div class="modal-section">
      <h4>Written Feedback</h4>
      <p>${f.feedbackText || '<em>No written comment provided.</em>'}</p>
    </div>

    <div class="modal-section">
      <h4>Detected Categories (local keyword analysis)</h4>
      ${
        (f.categories && f.categories.length)
          ? f.categories.map(c => `<span class="detected-tag">${c}</span>`).join('')
          : '<span class="muted small">No category keywords detected.</span>'
      }
      <p class="muted small" style="margin-top:8px;">${
        f.categories && f.categories.length
          ? `This feedback appears related to <strong>${f.categories[0].toLowerCase()}</strong>.`
          : 'This feedback did not match any known category keywords.'
      }</p>
    </div>

    <div class="modal-section">
      <h4>Response</h4>
      ${
        f.response
          ? `<p>${f.response}</p><span class="badge badge-responded">Responded</span>`
          : `
            <button class="btn btn-primary btn-sm" onclick="handleGenerateResponse('${f.id}')">Generate Response</button>
            <textarea id="response-output" placeholder="Generated response will appear here — feel free to edit before sending."></textarea>
            <div class="modal-actions">
              <button class="btn btn-outline btn-sm" onclick="markResponded('${f.id}')">Save &amp; Mark Responded</button>
            </div>
          `
      }
    </div>
  `;

  backdrop.hidden = false;
};

window.closeModal = function () {
  document.getElementById('modal-backdrop').hidden = true;
};

window.handleGenerateResponse = function (id) {
  const feedback = loadFeedback();
  const f = feedback.find(x => x.id === id);
  if (!f) return;
  const text = generateResponse(f);
  const out = document.getElementById('response-output');
  if (out) out.value = text;
};

window.markResponded = function (id) {
  const feedback = loadFeedback();
  const f = feedback.find(x => x.id === id);
  if (!f) return;
  const out = document.getElementById('response-output');
  const text = (out && out.value.trim()) || generateResponse(f);
  f.response = text;
  f.status = 'Responded';
  saveFeedback(feedback);
  closeModal();
  renderAllViews();
};

document.addEventListener('click', (e) => {
  if (e.target.id === 'modal-backdrop') closeModal();
});

/* ---------------- Review Requests ---------------- */

function renderRequests() {
  const requests = [...loadRequests()].sort((a, b) => new Date(b.dateSent) - new Date(a.dateSent));
  const el = document.getElementById('requests-list');
  if (!requests.length) {
    el.innerHTML = `<div class="mini-empty">No requests sent yet.</div>`;
    return;
  }
  el.innerHTML = requests.map(r => `
    <div class="request-row">
      <div>
        <div class="rname">${r.customerName}</div>
        <div class="rmeta">${r.orderService} · sent ${formatDate(r.dateSent)}</div>
      </div>
      <span class="badge ${r.status === 'Completed' ? 'badge-responded' : r.status === 'Ignored' ? 'badge-none' : 'badge-neutral'}">${r.status}</span>
    </div>
  `).join('');
}

function initSendRequestForm() {
  document.getElementById('form-send-request').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('req-name').value.trim();
    const order = document.getElementById('req-order').value.trim();
    if (!name || !order) return;

    const requests = loadRequests();
    requests.push({
      id: uid(),
      customerName: name,
      orderService: order,
      dateSent: new Date().toISOString(),
      status: 'Pending'
    });
    saveRequests(requests);

    document.getElementById('req-name').value = '';
    document.getElementById('req-order').value = '';
    renderRequests();
    renderDashboard();
  });
}

/* ---------------- Customer Simulator ---------------- */

let activeRequestId = null;
let simSelectedRating = 0;

function renderSimulator() {
  const requests = loadRequests().filter(r => r.status === 'Pending');
  const el = document.getElementById('pending-requests');

  document.getElementById('simulator-flow').hidden = true;
  document.getElementById('simulator-pending').hidden = false;

  if (!requests.length) {
    el.innerHTML = `<div class="pending-empty">No pending review requests. Send one from "Review Requests" first.</div>`;
    return;
  }

  el.innerHTML = requests.map(r => `
    <div class="pending-item">
      <div>
        <strong>${r.customerName}</strong> — <span class="muted">${r.orderService}</span>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openCustomerFlow('${r.id}')">Open Review Link</button>
    </div>
  `).join('');
}

window.openCustomerFlow = function (requestId) {
  activeRequestId = requestId;
  simSelectedRating = 0;
  document.getElementById('simulator-pending').hidden = true;
  const frame = document.getElementById('simulator-flow');
  frame.hidden = false;
  renderRatingStep();
};

function renderRatingStep() {
  const requests = loadRequests();
  const r = requests.find(x => x.id === activeRequestId);
  if (!r) return;

  const frame = document.getElementById('simulator-flow');
  frame.innerHTML = `
    <div class="phone-cafe-mark">N</div>
    <div class="phone-title">Hi ${r.customerName.split(' ')[0]}, thanks for visiting Nova Café!</div>
    <div class="phone-sub">You ordered: ${r.orderService}</div>
    <p><strong>How was your experience?</strong></p>
    <div class="star-picker">
      ${[1,2,3,4,5].map(n => `<button class="btn-star" data-n="${n}" onclick="pickStar(${n})">★</button>`).join('')}
    </div>
    <button class="btn btn-ghost" onclick="backToPending()">← back</button>
  `;
}

window.backToPending = function () {
  activeRequestId = null;
  renderSimulator();
};

window.pickStar = function (n) {
  simSelectedRating = n;
  const requests = loadRequests();
  const r = requests.find(x => x.id === activeRequestId);
  if (!r) return;

  const frame = document.getElementById('simulator-flow');

  if (n >= 4) {
    const settings = loadSettings();
    frame.innerHTML = `
      <div class="thankyou-check">🎉</div>
      <div class="phone-title">We're glad you enjoyed your experience!</div>
      <div class="phone-message positive">${starString(n)} — thanks for the great rating, ${r.customerName.split(' ')[0]}!</div>
      <p><strong>Would you like to leave a public review?</strong></p>
      <div class="public-links">
        <a class="public-link-btn" href="${settings.google}" target="_blank" rel="noopener">⭐ Leave a Google Review</a>
        <a class="public-link-btn" href="${settings.instagram}" target="_blank" rel="noopener">📷 Tag us on Instagram</a>
        <a class="public-link-btn" href="${settings.tripadvisor}" target="_blank" rel="noopener">🌍 Review us on TripAdvisor</a>
        <button class="btn btn-outline btn-sm" onclick="submitCustomerFeedback(${n}, true, '')">No written comment, just submit</button>
      </div>
      <div class="phone-message" style="margin-top:16px;">
        <label style="font-weight:600;font-size:0.85rem;">Want to add a quick comment too? (optional)</label>
        <textarea id="customer-private-feedback" placeholder="e.g. Loved the oat milk latte and the cozy seating!"></textarea>
        <button class="btn btn-primary btn-sm" style="margin-top:10px;" onclick="submitCustomerFeedbackFromField(${n}, true)">Submit</button>
      </div>
    `;
  } else {
    frame.innerHTML = `
      <div class="phone-title">We're sorry your experience wasn't perfect.</div>
      <div class="phone-message negative">${starString(n)} — we'd love to understand what happened, ${r.customerName.split(' ')[0]}.</div>
      <label style="font-weight:600;font-size:0.85rem;display:block;text-align:left;margin-top:10px;">Tell us more (private, only Nova Café sees this):</label>
      <textarea id="customer-private-feedback" placeholder="What could we have done better?"></textarea>
      <button class="btn btn-primary" style="margin-top:12px;width:100%;" onclick="submitCustomerFeedbackFromField(${n}, false)">Send Private Feedback</button>
      <p class="muted small" style="margin-top:10px;">This won't be posted publicly — it goes straight to the Nova Café team so they can follow up.</p>
    `;
  }
};

window.submitCustomerFeedbackFromField = function (rating, isPublic) {
  const field = document.getElementById('customer-private-feedback');
  const text = field ? field.value.trim() : '';
  submitCustomerFeedback(rating, isPublic, text);
};

window.submitCustomerFeedback = function (rating, isPublic, text) {
  const requests = loadRequests();
  const r = requests.find(x => x.id === activeRequestId);
  if (!r) return;

  const categories = detectCategories(text);
  const status = rating >= 4 ? 'No Response Needed' : 'Needs Response';

  const feedback = loadFeedback();
  feedback.push({
    id: uid(),
    customerName: r.customerName,
    orderService: r.orderService,
    date: new Date().toISOString(),
    rating,
    isPublic,
    feedbackText: text,
    categories,
    status,
    response: null
  });
  saveFeedback(feedback);

  r.status = 'Completed';
  saveRequests(requests);

  const frame = document.getElementById('simulator-flow');
  frame.innerHTML = `
    <div class="thankyou-check">✅</div>
    <div class="phone-title">Thank you, ${r.customerName.split(' ')[0]}!</div>
    <p class="muted">Your feedback has been sent to Nova Café.</p>
    <button class="btn btn-outline" style="margin-top:16px;" onclick="backToPending()">Simulate another customer</button>
  `;

  renderAllViews();
};

/* ---------------- Settings ---------------- */

function renderSettings() {
  const s = loadSettings();
  document.getElementById('setting-google').value = s.google;
  document.getElementById('setting-instagram').value = s.instagram;
  document.getElementById('setting-tripadvisor').value = s.tripadvisor;
}

function initSettingsForm() {
  document.getElementById('form-settings').addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings({
      google: document.getElementById('setting-google').value.trim() || defaultSettings().google,
      instagram: document.getElementById('setting-instagram').value.trim() || defaultSettings().instagram,
      tripadvisor: document.getElementById('setting-tripadvisor').value.trim() || defaultSettings().tripadvisor
    });
    alert('Settings saved.');
  });
}

/* ---------------- Reset demo ---------------- */

function initResetButton() {
  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    if (!confirm('Reset all demo data back to the original sample feedback and requests?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REQUESTS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    seedIfEmpty();
    renderAllViews();
  });
}

/* ---------------- Master render ---------------- */

function renderAllViews() {
  renderDashboard();
  renderInbox();
  renderRequests();
  if (!activeRequestId) renderSimulator();
  renderSettings();
}

/* ---------------- Init ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();
  initNav();
  initInboxFilters();
  initSendRequestForm();
  initSettingsForm();
  initResetButton();
  renderAllViews();
});
