export async function logHistory(
  supabase: any,
  {
    entryId,
    action,
    country,
    productClass,
    snapshot,
    changedBy,
  }: {
    entryId: string
    action: 'add' | 'edit' | 'delete'
    country: string
    productClass: string
    snapshot: Record<string, unknown>
    changedBy: string
  },
) {
  await supabase.from('entry_history').insert({
    entry_id: entryId,
    action,
    country,
    product_class: productClass,
    snapshot,
    changed_by: changedBy,
  })
}
