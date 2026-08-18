import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pin, cert_id, author, note, actual_months, actual_fee } = await req.json()

    const teamPin = Deno.env.get('TEAM_PIN')
    if (!teamPin || pin !== teamPin) {
      return new Response(JSON.stringify({ error: 'PIN이 올바르지 않습니다' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const hasNote = note?.trim()
    const hasMonths = actual_months !== null && actual_months !== undefined && actual_months !== ''
    const hasFee = actual_fee !== null && actual_fee !== undefined && actual_fee !== ''

    if (!cert_id || !author?.trim() || (!hasNote && !hasMonths && !hasFee)) {
      return new Response(
        JSON.stringify({ error: '이름과, 실제기간/실제수수료/메모 중 최소 하나는 입력해주세요' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

    const { data, error } = await supabase
      .from('team_notes')
      .insert({
        cert_id,
        author: author.trim(),
        note: hasNote ? note.trim() : null,
        actual_months: hasMonths ? Number(actual_months) : null,
        actual_fee: hasFee ? Number(actual_fee) : null,
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
