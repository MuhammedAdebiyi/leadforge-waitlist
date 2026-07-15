// ── Ticker content ──────────────────────────────────────────────────
const TICKER_ITEMS = [
  'NO WEBSITE = QUALIFIED LEAD', 'GOOGLE MAPS → TELEGRAM', 'RESUMABLE JOBS',
  'ZERO DUPLICATES', 'JOIN THE WAITLIST',
]
document.querySelectorAll('.ticker-track').forEach(track => {
  const content = [...TICKER_ITEMS, ...TICKER_ITEMS]
  track.innerHTML = content.map(item =>
    `<span class="flex items-center gap-3 px-4 shrink-0">${item} <span class="star">★</span></span>`
  ).join('')
})

// ── Waitlist count ──────────────────────────────────────────────────
async function loadCount() {
  const { count, error } = await db
    .from('waitlist')
    .select('*', { count: 'exact', head: true })

  const el = document.getElementById('waitlist-count')
  if (error || count === null) {
    el.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-gold mr-1"></span> Be one of the first to join`
    return
  }

  const displayCount = count + 40 // small baseline so it doesn't look empty on day 1
  el.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-gold animate-bounce-slow mr-1"></span> ${displayCount} people already on the list`
}
loadCount()

// ── Form submission ─────────────────────────────────────────────────
const form = document.getElementById('waitlist-form')
const btn = document.getElementById('submit-btn')
const btnText = document.getElementById('btn-text')
const message = document.getElementById('form-message')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = document.getElementById('email-input').value.trim()
  const role = document.getElementById('role-input').value

  if (!email) return

  btn.disabled = true
  btnText.textContent = 'Joining...'
  message.classList.add('hidden')

  const { error } = await db.from('waitlist').insert({
    email,
    role: role || null,
    referral_source: document.referrer || null,
  })

  if (error) {
    btn.disabled = false
    btnText.textContent = 'Get early access →'
    message.textContent = error.code === '23505'
      ? "You're already on the list! We'll email you at launch."
      : 'Something went wrong — try again.'
    message.className = 'text-xs mt-3 text-rust font-medium'
    message.classList.remove('hidden')
    return
  }

  // Success state
  form.innerHTML = `
    <div class="text-center py-4 animate-slide-up">
      <p class="text-3xl mb-3">🎉</p>
      <p class="font-semibold mb-1">You're on the list!</p>
      <p class="text-sm text-ink-muted">We'll email you the moment LeadForge launches.</p>
    </div>
  `
  loadCount()
})
