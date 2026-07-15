import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Verify the caller is an authenticated admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Get everyone not yet notified
  const { data: rows, error } = await supabase
    .from('waitlist')
    .select('id, email')
    .eq('notified', false)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0

  for (const row of rows) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'LeadForge <hello@coursevaultai.app>',
          to: row.email,
          subject: ' LeadForge is live',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h1 style="font-size: 22px;">LeadForge is live.</h1>
              <p>Thanks for waiting. LeadForge finds businesses without websites on
              Google Maps and sends them straight to your Telegram — automatically.</p>
              <p><a href="https://yourdomain.com" style="display:inline-block;background:#E3A72E;
                 color:#18130F;padding:12px 24px;text-decoration:none;font-weight:600;
                 border:3px solid #18130F;">Start your first job →</a></p>
            </div>
          `,
        }),
      })

      if (res.ok) {
        sent++
        await supabase.from('waitlist').update({ notified: true }).eq('id', row.id)
      }
    } catch (err) {
      console.error(`Failed to send to ${row.email}:`, err)
    }
  }

  return new Response(JSON.stringify({ sent, total: rows.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
