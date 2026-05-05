import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, Printer } from 'lucide-react';

export default function SowPublicView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = window.location.pathname.split('/').pop();

        if (!token) {
          setError('Invalid SOW link');
          setLoading(false);
          return;
        }

        // Fetch pipeline record by sow_generated_url token
        const records = await base44.entities.PipelineRecord.filter({
          sow_generated_url: `sow-${token}.pdf`
        });

        if (!records || records.length === 0) {
          setError('This link is no longer active');
          setLoading(false);
          return;
        }

        const record = records[0];

        // Fetch prospect data
        const prospect = record.prospect_id
          ? (await base44.entities.Prospect.filter({ id: record.prospect_id }))[0]
          : null;

        // Fetch settings
        const settingsList = await base44.entities.PracticeSettings.filter({});
        const practiceSettings = settingsList[0];

        setData({ record, prospect });
        setSettings(practiceSettings);
        setError(null);
      } catch (err) {
        setError('This link is no longer active');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-teal rounded-full animate-spin" style={{ borderTopColor: '#1DE9B6' }} />
          <p className="text-sm text-gray-600">Loading agreement…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <p className="font-medium text-sm mb-2">{error || 'Agreement not found'}</p>
            <p className="text-xs text-gray-600">
              {settings?.contact_email && (
                <>Questions? Contact us at {settings.contact_email}</>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { record, prospect } = data;
  const exclusionsList = record.scope_exclusions?.map(e => `<li>${e}</li>`).join('') || '';
  const fee = record.proposed_fee || 0;
  const deposit = Math.round(fee * 0.5 * 100) / 100;
  const balance = Math.round(fee * 0.5 * 100) / 100;

  const deliveryTarget = (() => {
    if (!record.proposed_kickoff_window) return '';
    const date = new Date(record.proposed_kickoff_window);
    let added = 0;
    while (added < 15) {
      date.setDate(date.getDate() + 1);
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return date.toISOString().split('T')[0];
  })();

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 style={{ color: '#0A2540', fontSize: '16px', fontWeight: '600' }}>Statement of Work</h1>
          <div className="flex gap-3">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button size="sm" style={{ backgroundColor: '#1d4ed8' }}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Document */}
      <div className="max-w-4xl mx-auto bg-white my-6 p-12 rounded-lg shadow">
        <style>{`
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none; }
          }
        `}</style>

        <div className="space-y-6 font-inter text-sm leading-relaxed" style={{ fontSize: '11px' }}>
          {/* Title */}
          <div className="text-center space-y-1 border-b pb-6">
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0A2540' }}>STATEMENT OF WORK</h1>
            <p style={{ fontSize: '10px', color: '#475569' }}>Supply Chain Diagnostic Engagement — AD-01 v2</p>
          </div>

          {/* SECTION 1 */}
          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 1 — SCOPE OF SERVICES</h2>
            <p style={{ marginBottom: '8px' }}>
              The Consultant will conduct a comprehensive supply chain diagnostic engagement for {prospect?.facility_name}, focusing on the following procedure types and service categories: <strong>{prospect?.specialty_focus}</strong>.
            </p>
            <p style={{ marginBottom: '8px' }}>The following items are explicitly EXCLUDED from this engagement:</p>
            <ul style={{ marginLeft: '16px', marginBottom: '8px' }}>
              {exclusionsList && <div dangerouslySetInnerHTML={{ __html: exclusionsList }} />}
            </ul>
            <p style={{ fontStyle: 'italic' }}>Any services not explicitly described above are outside the scope of this engagement.</p>
          </div>

          {/* SECTION 2 */}
          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 2 — ENGAGEMENT TEAM</h2>
            <div style={{ marginLeft: '16px' }}>
              <p><strong>Consultant:</strong> {settings?.founder_name || '[Founder Name]'}</p>
              <p><strong>Operations Lead:</strong> {settings?.operator_name || '[Operator Name]'}</p>
              <p><strong>Client Point of Contact:</strong> {prospect?.admin_name}</p>
            </div>
          </div>

          {/* SECTION 3 */}
          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 3 — TIMELINE</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px', fontWeight: '600' }}>Engagement kickoff</td>
                  <td style={{ padding: '6px' }}>{record.proposed_kickoff_window || 'TBD'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px', fontWeight: '600' }}>Data delivery by Client</td>
                  <td style={{ padding: '6px' }}>Within 7 calendar days of kickoff call</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px', fontWeight: '600' }}>On-site walkthrough</td>
                  <td style={{ padding: '6px' }}>TBD (Week 1)</td>
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

          {/* SECTION 4 */}
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

          {/* SECTION 5 */}
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

          {/* SECTION 6 */}
          <div style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px' }}>
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

          {/* SECTION 7-12 */}
          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 7 — CONFIDENTIALITY</h2>
            <p style={{ marginBottom: '8px', fontSize: '10px' }}>
              Each party agrees to keep the other party's confidential information strictly confidential. Client data will be used exclusively for the purposes of this engagement, retained no more than 24 months following engagement completion for anonymized benchmarking purposes, and securely deleted thereafter upon request.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 8 — LIMITATION OF LIABILITY</h2>
            <p style={{ fontSize: '10px' }}>
              IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. EACH PARTY'S TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID OR PAYABLE UNDER THIS ENGAGEMENT.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 9 — TERM AND TERMINATION</h2>
            <p style={{ fontSize: '10px' }}>
              The engagement begins on the kickoff date and ends upon delivery of findings. Either party may terminate with 5 business days written notice. If Client terminates after work commences, the full engagement fee remains due.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 10 — DISPUTE RESOLUTION</h2>
            <p style={{ fontSize: '10px' }}>
              Disputes shall be resolved first through good-faith negotiation. If negotiation fails, disputes shall be subject to binding arbitration in the governing county.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 11 — ENTIRE AGREEMENT</h2>
            <p style={{ fontSize: '10px' }}>
              This Statement of Work constitutes the entire agreement between the parties. Amendments must be in writing and signed by both parties.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>SECTION 12 — GOVERNING LAW</h2>
            <p style={{ fontSize: '10px' }}>
              This Agreement shall be governed by the laws of the State of Georgia, {settings?.governing_county || '[County]'}.
            </p>
          </div>

          {/* Signature Blocks */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', fontSize: '10px' }}>
              <div>
                <div style={{ borderBottom: '1px solid #0A2540', marginBottom: '4px', minHeight: '40px' }} />
                <div><strong>{prospect?.admin_name}</strong></div>
                <div>{prospect?.facility_name}</div>
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
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto pb-12 text-center">
        <p className="text-xs text-gray-600">
          {settings?.contact_email && (
            <>
              Questions? Contact us at {settings.contact_email}
              {settings?.contact_phone && <> or {settings.contact_phone}</>}
            </>
          )}
        </p>
      </div>
    </div>
  );
}