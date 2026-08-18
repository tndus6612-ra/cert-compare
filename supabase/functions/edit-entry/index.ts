import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REQUIRED_FIELDS = [
  'region',
  'country',
  'authority',
  'applicationType',
  'productClass',
  'periodDescription',
  'governmentFeeLocal',
  'validity',
  'source',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { pin, id, isCustom, editedBy, monthsApprox, notes } = body

    const teamPin = Deno.env.get('TEAM_PIN')
    if (!teamPin || pin !== teamPin) {
      return new Response(JSON.stringify({ error: 'PIN이 올바르지 않습니다' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!id || !editedBy?.trim()) {
      return new Response(JSON.stringify({ error: '항목ID와 수정자 이름을 입력해주세요' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    for (const field of REQUIRED_FIELDS) {
      if (!body[field]?.toString().trim()) {
        return new Response(JSON.stringify({ error: `필수 항목이 비어 있습니다: ${field}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

    const row = {
      region: body.region,
      country: body.country.trim(),
      authority: body.authority.trim(),
      application_type: body.applicationType.trim(),
      product_class: body.productClass.trim(),
      months_approx: monthsApprox === '' || monthsApprox == null ? null : Number(monthsApprox),
      period_description: body.periodDescription.trim(),
      government_fee_local: body.governmentFeeLocal.trim(),
      validity: body.validity.trim(),
      notes: notes?.trim() ? notes.trim() : null,
      source: body.source.trim(),
    }

    let data, error

    if (isCustom) {
      ;({ data, error } = await supabase.from('custom_entries').update(row).eq('id', id).select().single())
    } else {
      ;({ data, error } = await supabase
        .from('entry_overrides')
        .upsert({ id, ...row, edited_by: editedBy.trim() })
        .select()
        .single())
    }

    if (error) throw error

    return new Response(JSON.stringify({ data, isCustom: Boolean(isCustom) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
