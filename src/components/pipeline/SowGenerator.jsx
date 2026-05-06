import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, X } from 'lucide-react';

const SCOPE_EXCLUSIONS = [
  "Hospital-affiliated department spend",
  "Pharmacy-only spend",
  "Capital equipment purchases",
  "Physician office supply spend",
  "Out-of-state facilities",
  "Implementation services beyond findings delivery",
  "Vendor negotiation on client's behalf",
];

export default function SowGenerator({ record, prospect, settings, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({
    client_name: prospect?.facility_name || '',
    admin_name: prospect?.admin_name || '',
    admin_title: 'Administrator',
    facility_address: prospect?.address || '',
    procedure_types: prospect?.specialty_focus || '',
    scope_exclusions: [],
    custom_exclusion: '',
    engagement_fee: record.proposed_fee || 0,
    kickoff_date: record.proposed_kickoff_window || '',
    onsite_date: '',
    governing_county: settings?.governing_county || '',
  });

  const fee = parseFloat(fields.engagement_fee) || 0;
  const deposit = Math.round(fee * 0.5 * 100) / 100;
  const balance = Math.round(fee * 0.5 * 100) / 100;

  const deliveryTarget = useMemo(() => {
    if (!fields.kickoff_date) return '';
    const date = new Date(fields.kickoff_date);
    if (isNaN(date.getTime())) return '';
    let added = 0;
    while (added < 15) {
      date.setDate(date.getDate() + 1);
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return date.toISOString().split('T')[0];
  }, [fields.kickoff_date]);

  const handleCheckbox = (item) => {
    setFields(f => ({
      ...f,
      scope_exclusions: f.scope_exclusions.includes(item)
        ? f.scope_exclusions.filter(e => e !== item)
        : [...f.scope_exclusions, item]
    }));
  };

  const handleAddCustom = () => {
    if (fields.custom_exclusion.trim() && !fields.scope_exclusions.includes(fields.custom_exclusion)) {
      setFields(f => ({
        ...f,
        scope_exclusions: [...f.scope_exclusions, f.custom_exclusion],
        custom_exclusion: ''
      }));
    }
  };

  const handleRemoveCustom = (item) => {
    if (!SCOPE_EXCLUSIONS.includes(item)) {
      setFields(f => ({
        ...f,
        scope_exclusions: f.scope_exclusions.filter(e => e !== item)
      }));
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await base44.entities.PipelineRecord.update(record.id, {
        sow_generated_url: `sow-${Date.now()}.pdf`,
        sow_generated_date: new Date().toISOString().split('T')[0],
        scope_exclusions: fields.scope_exclusions,
        deposit_amount: deposit,
        balance_amount: balance,
      });
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error generating SOW:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle>Generate Service Agreement — AD-01 v2</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </CardHeader>

        <div className="flex-1 overflow-hidden flex gap-6 p-6">
          {/* LEFT PANEL — Editor */}
          <div className="w-1/2 overflow-y-auto space-y-4 pr-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold" style={{ color: '#0A2540' }}>Client Information</h3>
              <div>
                <Label className="text-xs">Facility Name *</Label>
                <Input value={fields.client_name} onChange={e => setFields(f => ({ ...f, client_name: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Administrator Name *</Label>
                  <Input value={fields.admin_name} onChange={e => setFields(f => ({ ...f, admin_name: e.target.value }))} className="mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={fields.admin_title} onChange={e => setFields(f => ({ ...f, admin_title: e.target.value }))} className="mt-1 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Facility Address</Label>
                <Input value={fields.facility_address} onChange={e => setFields(f => ({ ...f, facility_address: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Procedure Types in Scope</Label>
                <Input value={fields.procedure_types} onChange={e => setFields(f => ({ ...f, procedure_types: e.target.value }))} className="mt-1 text-sm" />
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold" style={{ color: '#0A2540' }}>Scope Exclusions</h3>
              <div className="space-y-2">
                {SCOPE_EXCLUSIONS.map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <Checkbox
                      checked={fields.scope_exclusions.includes(item)}
                      onCheckedChange={() => handleCheckbox(item)}
                      id={`excl-${item}`}
                    />
                    <label htmlFor={`excl-${item}`} className="text-xs cursor-pointer">{item}</label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  value={fields.custom_exclusion}
                  onChange={e => setFields(f => ({ ...f, custom_exclusion: e.target.value }))}
                  placeholder="Add custom exclusion…"
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={handleAddCustom}>Add</Button>
              </div>
              {fields.scope_exclusions.filter(e => !SCOPE_EXCLUSIONS.includes(e)).map(item => (
                <div key={item} className="flex items-center justify-between bg-secondary/50 p-2 rounded-sm text-xs">
                  <span>{item}</span>
                  <button onClick={() => handleRemoveCustom(item)} className="text-destructive hover:opacity-70">×</button>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold" style={{ color: '#0A2540' }}>Financial & Timeline</h3>
              <div>
                <Label className="text-xs">Engagement Fee</Label>
                <Input type="number" value={fields.engagement_fee} onChange={e => setFields(f => ({ ...f, engagement_fee: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Proposed Kickoff Date</Label>
                <Input type="date" value={fields.kickoff_date} onChange={e => setFields(f => ({ ...f, kickoff_date: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">On-Site Walkthrough Date</Label>
                <Input type="date" value={fields.onsite_date} onChange={e => setFields(f => ({ ...f, onsite_date: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Governing County</Label>
                <Input value={fields.governing_county} onChange={e => setFields(f => ({ ...f, governing_county: e.target.value }))} className="mt-1 text-sm" />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — Preview */}
          <div className="w-1/2 overflow-y-auto border-l pl-6">
            <SowPreview
              fields={fields}
              deposit={deposit}
              balance={balance}
              deliveryTarget={deliveryTarget}
              settings={settings}
            />
          </div>
        </div>

        <div className="border-t p-6 flex justify-end gap-3 bg-secondary/30">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={loading} style={{ backgroundColor: '#1d4ed8' }}>
            {loading ? 'Generating…' : 'Generate Service Agreement'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SowPreview({ fields, deposit, balance, deliveryTarget, settings }) {
  const exclusionsList = fields.scope_exclusions.map(e => `<li>${e}</li>`).join('');

  return (
    <div className="bg-white p-8 rounded-lg space-y-6 font-inter text-xs leading-relaxed" style={{ fontSize: '11px' }}>
      <div className="text-center space-y-1 border-b pb-4">
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0A2540' }}>STATEMENT OF WORK</h1>
        <p style={{ fontSize: '10px', color: '#475569' }}>Supply Chain Diagnostic Engagement — AD-01 v2</p>
      </div>

      {/* SECTION 1 — SCOPE OF SERVICES */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 1 — SCOPE OF SERVICES</h2>
        <p style={{ marginBottom: '8px' }}>
          The Consultant will conduct a comprehensive supply chain diagnostic engagement for {fields.client_name}, focusing on the following procedure types and service categories: <strong>{fields.procedure_types}</strong>. This engagement includes analysis of procurement patterns, vendor contract optimization, GPO tier alignment, inventory management efficiency, and charge capture accuracy.
        </p>
        <p style={{ marginBottom: '8px' }}>The following items are explicitly EXCLUDED from this engagement:</p>
        <ul style={{ marginLeft: '16px', marginBottom: '8px' }}>
          {exclusionsList && <div dangerouslySetInnerHTML={{ __html: exclusionsList }} />}
        </ul>
        <p style={{ fontStyle: 'italic' }}>Any services not explicitly described above are outside the scope of this engagement.</p>
      </div>

      {/* SECTION 2 — ENGAGEMENT TEAM */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 2 — ENGAGEMENT TEAM</h2>
        <div style={{ marginLeft: '16px' }}>
          <p><strong>Consultant:</strong> {settings?.founder_name || '[Founder Name]'}</p>
          <p><strong>Operations Lead:</strong> {settings?.operator_name || '[Operator Name]'}</p>
          <p><strong>Client Point of Contact:</strong> {fields.admin_name}, {fields.admin_title}</p>
        </div>
      </div>

      {/* SECTION 3 — TIMELINE */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 3 — TIMELINE</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '6px', fontWeight: '600' }}>Engagement kickoff</td>
              <td style={{ padding: '6px' }}>{fields.kickoff_date || 'TBD'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '6px', fontWeight: '600' }}>Data delivery by Client</td>
              <td style={{ padding: '6px' }}>Within 7 calendar days of kickoff call</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '6px', fontWeight: '600' }}>On-site walkthrough</td>
              <td style={{ padding: '6px' }}>{fields.onsite_date || 'TBD'} (Week 1)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '6px', fontWeight: '600' }}>Findings delivery</td>
              <td style={{ padding: '6px' }}>{deliveryTarget || 'TBD'} (15 business days from kickoff)</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', fontWeight: '600' }}>Findings presentation</td>
              <td style={{ padding: '6px' }}>TBD (scheduled after analysis complete)</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginBottom: '8px', fontSize: '10px' }}>
          <strong>Timeline Contingency:</strong> Timeline is contingent on Client delivering all requested data by the deadline specified above. Delays in Client data delivery will extend the delivery timeline by the same number of business days. Data delivery failures do not affect the fee obligation or the guarantee calculation — see Section 6.
        </p>
      </div>

      {/* SECTION 4 — DATA ACCESS */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 4 — DATA ACCESS</h2>
        <p style={{ marginBottom: '8px' }}>
          Client agrees to provide the following data sets via Consultant's secure file transfer portal within 7 calendar days of the kickoff call:
        </p>
        <ul style={{ marginLeft: '16px', marginBottom: '8px', fontSize: '10px' }}>
          <li>12 months of purchase order line-item data (CSV or Excel export from accounting system)</li>
          <li>Current vendor contracts for the top 20 vendors by annual spend (PDF)</li>
          <li>GPO membership documentation and current tier</li>
          <li>Case volume report by surgeon and procedure type, 12-month period</li>
          <li>Current PAR level inventory list</li>
          <li>Sample preference cards for each active surgeon (3–5 per surgeon)</li>
        </ul>
        <p style={{ fontSize: '10px' }}>
          Client acknowledges that incomplete or delayed data delivery will affect the quality and scope of the findings, and that any reduction in findings quality resulting from Client's data delivery failures does not affect the engagement fee or the guarantee threshold calculation.
        </p>
      </div>

      {/* SECTION 5 — FEES AND PAYMENT TERMS */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 5 — FEES AND PAYMENT TERMS</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '10px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '6px', fontWeight: '600' }}>Deposit (50%)</td>
              <td style={{ padding: '6px', textAlign: 'right' }}>${deposit.toLocaleString()}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '6px', fontWeight: '600' }}>Balance (50%)</td>
              <td style={{ padding: '6px', textAlign: 'right' }}>${balance.toLocaleString()}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', fontWeight: '700' }}>Total Fee</td>
              <td style={{ padding: '6px', textAlign: 'right', fontWeight: '700' }}>${(deposit + balance).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '10px' }}>
          IMPORTANT: The engagement fee is fully earned when work commences. The fee is not subject to refund, reduction, or offset for any reason, including findings that do not meet the guarantee threshold defined in Section 6. The guarantee in Section 6 governs retainer engagement only — not the diagnostic fee.
        </p>
        <p style={{ marginBottom: '4px', fontSize: '10px' }}>
          <strong>Late payment:</strong> Balances unpaid more than 7 days after the due date accrue a late payment fee of 1.5% per month on the outstanding balance.
        </p>
        <p style={{ fontSize: '10px' }}>
          <strong>Payment methods:</strong> ACH bank transfer (preferred), wire transfer, credit card (subject to a 2.9% processing fee).
        </p>
      </div>

      {/* SECTION 6 — THE 3× GUARANTEE */}
      <div style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Lock className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
          <span style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fixed per practice policy — cannot be edited</span>
        </div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 6 — THE 3× GUARANTEE</h2>
        
        <p style={{ marginBottom: '8px', fontSize: '10px' }}>
          <strong>6.1 Guarantee Statement:</strong> If total identified savings do not equal or exceed 3 times the fee, Consultant will not propose or pursue any further paid engagement with Client.
        </p>

        <p style={{ marginBottom: '8px', fontSize: '10px' }}>
          <strong>6.2 What the Guarantee Covers:</strong> This guarantee governs whether Consultant proposes a retainer after findings. It does NOT cover the diagnostic fee.
        </p>

        <p style={{ marginBottom: '6px', fontSize: '10px' }}>
          <strong>6.3 How "Identified Savings Opportunities" Are Calculated:</strong> Savings are confidence-weighted as follows:
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '9px' }}>
          <tbody>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '4px', fontWeight: '600' }}>Category</td>
              <td style={{ padding: '4px', fontWeight: '600' }}>Confidence</td>
              <td style={{ padding: '4px', fontWeight: '600' }}>Weight</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '4px' }}>PPI Variance</td>
              <td style={{ padding: '4px' }}>High</td>
              <td style={{ padding: '4px' }}>100%</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '4px' }}>Off-Contract Spend</td>
              <td style={{ padding: '4px' }}>High</td>
              <td style={{ padding: '4px' }}>100%</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '4px' }}>GPO Tier Optimization</td>
              <td style={{ padding: '4px' }}>Medium</td>
              <td style={{ padding: '4px' }}>50%</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '4px' }}>Inventory Waste</td>
              <td style={{ padding: '4px' }}>High</td>
              <td style={{ padding: '4px' }}>100%</td>
            </tr>
            <tr>
              <td style={{ padding: '4px' }}>Charge Capture Gap</td>
              <td style={{ padding: '4px' }}>Medium</td>
              <td style={{ padding: '4px' }}>50%</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginBottom: '8px', fontSize: '9px', fontStyle: 'italic' }}>
          Example: $15,000 fee × 3 = $45,000 threshold. Identified opportunities totaling $50,000 with weights applied → guarantee met.
        </p>

        <p style={{ marginBottom: '8px', fontSize: '10px' }}>
          <strong>6.4 What the Guarantee Does Not Cover:</strong> The diagnostic fee; whether Client implements recommendations; realized (versus identified) savings; findings outside agreed scope; categories not in scope; findings limited by Client's data delivery failures.
        </p>

        <p style={{ marginBottom: '8px', fontSize: '10px' }}>
          <strong>6.5 Guarantee Threshold Is Void If:</strong> (a) Client failed to deliver data on time; (b) Client materially misrepresented facts; (c) Client interfered with on-site access.
        </p>

        <p style={{ fontSize: '10px' }}>
          <strong>6.6 Post-Findings Posture:</strong> If threshold is met: propose retainer. If not met: state directly, present findings, make no retainer proposal, no further outreach.
        </p>
      </div>

      {/* SECTION 7 — CONFIDENTIALITY */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 7 — CONFIDENTIALITY</h2>
        <p>
          Each party agrees to keep the other party's confidential information strictly confidential. Client data will be used exclusively for the purposes of this engagement, retained no more than 24 months following engagement completion for anonymized benchmarking purposes, and securely deleted thereafter upon request.
        </p>
      </div>

      {/* SECTION 8 — LIMITATION OF LIABILITY */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 8 — LIMITATION OF LIABILITY</h2>
        <p>
          IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. EACH PARTY'S TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID OR PAYABLE UNDER THIS ENGAGEMENT.
        </p>
      </div>

      {/* SECTION 9 — TERM AND TERMINATION */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 9 — TERM AND TERMINATION</h2>
        <p>
          The engagement begins on the kickoff date and ends upon delivery of findings. Either party may terminate with 5 business days written notice. If Client terminates after work commences, the full engagement fee remains due.
        </p>
      </div>

      {/* SECTION 10 — DISPUTE RESOLUTION */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 10 — DISPUTE RESOLUTION</h2>
        <p>
          Disputes shall be resolved first through good-faith negotiation. If negotiation fails, disputes shall be subject to binding arbitration in the governing county.
        </p>
      </div>

      {/* SECTION 11 — ENTIRE AGREEMENT */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 11 — ENTIRE AGREEMENT</h2>
        <p>
          This Statement of Work constitutes the entire agreement between the parties. Amendments must be in writing and signed by both parties.
        </p>
      </div>

      {/* SECTION 12 — GOVERNING LAW */}
      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 12 — GOVERNING LAW</h2>
        <p>
          This Agreement shall be governed by the laws of the State of Georgia, {fields.governing_county}.
        </p>
      </div>

      {/* SIGNATURE BLOCKS */}
      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #E2E8F0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', fontSize: '10px' }}>
          <div>
            <div style={{ borderBottom: '1px solid #0A2540', marginBottom: '4px', minHeight: '40px' }} />
            <div><strong>{fields.admin_name}</strong></div>
            <div>{fields.admin_title}</div>
            <div>{fields.client_name}</div>
            <div style={{ marginTop: '8px' }}>Date: _______________</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #0A2540', marginBottom: '4px', minHeight: '40px' }} />
            <div><strong>{settings?.founder_name || '[Founder Name]'}</strong></div>
            <div>{settings?.practice_name || '[Practice Name]'}</div>
            <div style={{ marginTop: '8px' }}>Date: _______________</div>
          </div>
        </div>
      </div>
    </div>
  );
}