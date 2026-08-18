import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logHistory } from '../_shared/history.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { pin, id, isCustom, deletedBy } = body

    const teamPin = Deno.env.get('TEAM_PIN')
    if (!teamPin || pin !== teamPin) {
      return new Response(JSON.stringify({ error: 'PIN이 올바르지 않습니다' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!id || !deletedBy?.trim()) {
      return new Response(JSON.stringify({ error: '항목ID와 삭제자 이름을 입력해주세요' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

    let snapshot

    if (isCustom) {
      const { data, error } = await supabase.from('custom_entries').delete().eq('id', id).select().single()
      if (error) throw error
      snapshot = data
    } else {
      // 공식 데이터는 파일을 못 지우니, 화면에 안 보이도록 숨김 처리만 한다.
      const row = {
        region: body.region,
        country: body.country,
        authority: body.authority,
        application_type: body.applicationType,
        product_class: body.productClass,
        months_approx: body.monthsApprox === '' || body.monthsApprox == null ? null : Number(body.monthsApprox),
        period_description: body.periodDescription,
        government_fee_local: body.governmentFeeLocal,
        validity: body.validity,
        notes: body.notes?.trim() ? body.notes.trim() : null,
        source: body.source,
      }
      const { data, error } = await supabase
        .from('entry_overrides')
        .upsert({ id, ...row, edited_by: deletedBy.trim(), deleted: true })
        .select()
        .single()
      if (error) throw error
      snapshot = data
    }

    await logHistory(supabase, {
      entryId: id,
      action: 'delete',
      country: snapshot.country,
      productClass: snapshot.product_class,
      snapshot,
      changedBy: deletedBy.trim(),
    })

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
