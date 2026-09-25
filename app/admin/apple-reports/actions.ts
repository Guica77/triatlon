'use server'

import { createHash } from 'node:crypto'
import { checkAdminAccess } from '@/app/admin/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function reconcileAppleReportCohort(form: FormData) {
  if (!(await checkAdminAccess())) throw new Error('No autorizado')
  const reportReference = form.get('reportReference')
  const fiscalPeriod = form.get('fiscalPeriod')
  const transactionDate = form.get('transactionDate')
  const productID = form.get('productID')
  const storefront = form.get('storefront')
  const customerCurrency = form.get('customerCurrency')
  const customerPriceMilli = form.get('customerPriceMilli')
  const reportUnits = form.get('reportUnits')
  const proceedsCurrency = form.get('proceedsCurrency')
  const finalizedProceeds = form.get('finalizedProceeds')
  const reportFile = form.get('reportFile')
  const rawTransactionIDs = form.get('transactionIDs')
  const entryType = form.get('entryType')
  const proceedsPattern = entryType === 'return'
    ? /^-\d{1,16}(?:\.\d{1,4})?$/
    : /^\d{1,16}(?:\.\d{1,4})?$/
  const parsedTransactionDate = typeof transactionDate === 'string'
    ? new Date(`${transactionDate}T00:00:00.000Z`)
    : null

  if (typeof reportReference !== 'string' || reportReference.trim().length < 1 || reportReference.length > 200 ||
      typeof fiscalPeriod !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(fiscalPeriod) ||
      typeof transactionDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(transactionDate) ||
      !parsedTransactionDate || Number.isNaN(parsedTransactionDate.getTime()) || parsedTransactionDate.toISOString().slice(0, 10) !== transactionDate ||
      typeof productID !== 'string' || !/^com\.triwavex\.athlete\.monthly$/.test(productID) ||
      typeof storefront !== 'string' || !/^[A-Z]{3}$/.test(storefront) ||
      typeof customerCurrency !== 'string' || !/^[A-Z]{3}$/.test(customerCurrency) ||
      typeof customerPriceMilli !== 'string' || !/^\d{1,15}$/.test(customerPriceMilli) || Number(customerPriceMilli) <= 0 ||
      typeof reportUnits !== 'string' || !/^\d{1,4}$/.test(reportUnits) || Number(reportUnits) <= 0 || Number(reportUnits) > 1000 ||
      typeof proceedsCurrency !== 'string' || !/^[A-Z]{3}$/.test(proceedsCurrency) ||
      (entryType !== 'sale' && entryType !== 'return') ||
      typeof finalizedProceeds !== 'string' || !proceedsPattern.test(finalizedProceeds) ||
      !(reportFile instanceof File) || reportFile.size < 1 || reportFile.size > 4 * 1024 * 1024 ||
      typeof rawTransactionIDs !== 'string') {
    throw new Error('Los datos de conciliación no son válidos.')
  }
  const reportSHA256 = createHash('sha256')
    .update(Buffer.from(await reportFile.arrayBuffer()))
    .digest('hex')

  let transactionIDs: unknown
  try { transactionIDs = JSON.parse(rawTransactionIDs) } catch { throw new Error('La selección de periodos no es válida.') }
  if (!Array.isArray(transactionIDs) || transactionIDs.length !== Number(reportUnits) ||
      transactionIDs.some(id => typeof id !== 'string' || (entryType === 'return'
        ? !/^\d{1,40}:(?:REFUND|REVOKE):[0-9 .:+-]{15,60}$/.test(id)
        : !/^\d{1,40}$/.test(id))) ||
      new Set(transactionIDs).size !== transactionIDs.length) {
    throw new Error('Las unidades del informe no coinciden con los periodos seleccionados.')
  }

  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) throw new Error('La sesión ha caducado.')

  const db = createAdminClient() as any
  const { error } = await db.rpc('reconcile_apple_report_cohort', {
    p_report_reference: reportReference.trim(),
    p_fiscal_period: fiscalPeriod,
    p_transaction_date: transactionDate,
    p_product_id: productID,
    p_storefront: storefront,
    p_customer_currency: customerCurrency,
    p_customer_price_milli: Number(customerPriceMilli),
    p_report_units: Number(reportUnits),
    p_proceeds_currency: proceedsCurrency,
    p_finalized_proceeds: finalizedProceeds,
    p_report_sha256: reportSHA256,
    p_imported_by: user.id,
    p_transaction_ids: transactionIDs,
    p_entry_type: entryType,
  })
  if (error) throw new Error('Apple no coincide con este grupo, o ya se ha conciliado. Revisa la fecha, las unidades y el importe del informe final.')
  revalidatePath('/admin/apple-reports')
  revalidatePath('/admin/apple-products')
}
