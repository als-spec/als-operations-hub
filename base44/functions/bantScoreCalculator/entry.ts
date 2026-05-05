import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 2: BANT SCORE AUTO-CALCULATOR
 * Auto-calculates bant_score and deposit/balance amounts
 * Trigger: BEFORE UPDATE on PipelineRecord
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { record } = await req.json();

    const scoreMap = {
      "Pass": 1,
      "Conditional": 0,
      "Fail": 0,
      "": 0
    };

    const budget = scoreMap[record.bant_budget] ?? 0;
    const authority = scoreMap[record.bant_authority] ?? 0;
    const need = scoreMap[record.bant_need] ?? 0;
    const timeline = scoreMap[record.bant_timeline] ?? 0;

    record.bant_score = budget + authority + need + timeline;

    // Auto-calc deposit/balance amounts
    const fee = record.proposed_fee;
    if (fee && fee > 0) {
      if (!record.deposit_amount) {
        record.deposit_amount = Math.round(fee * 0.5 * 100) / 100;
      }
      if (!record.balance_amount) {
        record.balance_amount = Math.round(fee * 0.5 * 100) / 100;
      }
    }

    return Response.json({ allow: true, record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});