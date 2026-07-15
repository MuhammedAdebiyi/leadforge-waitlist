const loginView = document.getElementById('login-view')
const dashboardView = document.getElementById('dashboard-view')

// ── Auth ──────────────────────────────────────────────────────────
async function checkSession() {
  const { data: { session } } = await db.auth.getSession()
  if (session) {
    loginView.classList.add('hidden')
    dashboardView.classList.remove('hidden')
    loadDashboard()
  } else {
    loginView.classList.remove('hidden')
    dashboardView.classList.add('hidden')
  }
}
checkSession()

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = document.getElementById('login-email').value
  const password = document.getElementById('login-password').value
  const errorEl = document.getElementById('login-error')

  const { error } = await db.auth.signInWithPassword({ email, password })

  if (error) {
    errorEl.textContent = 'Invalid credentials'
    errorEl.classList.remove('hidden')
    return
  }
  checkSession()
})

document.getElementById('logout-btn').addEventListener('click', async () => {
  await db.auth.signOut()
  checkSession()
})

// ── Load data ─────────────────────────────────────────────────────
let allRows = []

async function loadDashboard() {
  const { data, error } = await db
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  allRows = data

  // Stats
  document.getElementById('stat-total').textContent = data.length
  document.getElementById('stat-notified').textContent = data.filter(r => r.notified).length

  const today = new Date().toDateString()
  document.getElementById('stat-today').textContent =
    data.filter(r => new Date(r.created_at).toDateString() === today).length

  // Table
  const tbody = document.getElementById('waitlist-table')
  tbody.innerHTML = data.map(row => `
    <tr>
      <td class="font-medium">${escapeHtml(row.email)}</td>
      <td class="text-ink-muted">${row.role ?? '—'}</td>
      <td class="text-ink-muted font-mono text-xs">${new Date(row.created_at).toLocaleDateString()}</td>
      <td>${row.notified ? '✅' : '—'}</td>
    </tr>
  `).join('')
}

function escapeHtml(s) {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

// ── Export CSV ────────────────────────────────────────────────────
document.getElementById('export-btn').addEventListener('click', () => {
  const header = 'Email,Role,Referral,Joined,Notified\n'
  const rows = allRows.map(r =>
    [r.email, r.role ?? '', r.referral_source ?? '', r.created_at, r.notified].join(',')
  ).join('\n')

  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leadforge-waitlist-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
})

// ── Send launch email ────────────────────────────────────────────
document.getElementById('notify-btn').addEventListener('click', async () => {
  if (!confirm(`Send launch email to ${allRows.filter(r => !r.notified).length} people who haven't been notified yet?`)) return

  const btn = document.getElementById('notify-btn')
  btn.disabled = true
  btn.textContent = 'Sending...'

  try {
    const { data: { session } } = await db.auth.getSession()

    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-launch-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    const result = await res.json()

    if (!res.ok) throw new Error(result.error ?? 'Failed to send')

    alert(`✅ Sent to ${result.sent} people`)
    loadDashboard()
  } catch (err) {
    alert(`❌ ${err.message}`)
  } finally {
    btn.disabled = false
    btn.textContent = 'Send Launch Email'
  }
})
