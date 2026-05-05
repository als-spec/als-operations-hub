import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, X } from 'lucide-react';
import { format, addDays } from 'date-fns';

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
    deposit_amount: record.deposit_amount || 0,
    balance_amount: record.balance_amount || 0,
    kickoff_date: record.proposed_kickoff_window || '',
    delivery_target: '',
    onsite_date: '',
    governing_county: settings?.governing_county || '',
  });

  // Auto-calculate deposit/balance
  const fee = parseFloat(fields.engagement_fee) || 0;
  const deposit = Math.round(fee * 0.5 * 100) / 100;
  const balance = Math.round(fee * 0.5 * 100) / 100;

  // Auto-calculate delivery target (15 business days from kickoff)
  const deliveryTarget = useMemo(() => {
    if (!fields.kickoff_date) return '';
    const date = new Date(fields.kickoff_date);
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
      // Call sowGenerator function to generate PDF
      const response = await base44.functions.invoke('sowGenerator', {
        pipeline_record_id: record.id,
        sow_fields: {
          ...fields,
          deposit_amount: deposit,
          balance_amount: balance,
          delivery_target: deliveryTarget,
        }
      });

      if (response.data.success) {
        // In real scenario, you'd upload the HTML to PDF and get a URL
        // For now, we'll update the record with a placeholder and trigger the stage advance
        await base44.entities.PipelineRecord.update(record.id, {
          sow_generated_url: `sow-${Date.now()}.pdf`,
          sow_generated_date: new Date().toISOString().split('T')[0],
          scope_exclusions: fields.scope_exclusions,
          deposit_amount: deposit,
          balance_amount: balance,
          // Stage will auto-advance via sowAutoAdvance function
        });

        onSuccess?.();
        onClose?.();
      }
    } catch (error) {
      console.error('Error generating SOW:', error);
    } finally {
      setLoading(false);
    }
  };

  const exclusionsList = fields.scope_exclusions.map((e, i) => `<li>${e}</li>`).join('\n');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle>Generate Service Agreement</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </CardHeader>

        <div className="flex-1 overflow-hidden flex gap-6 p-6">
          {/* LEFT PANEL — Editor */}
          <div className="w-1/2 overflow-y-auto space-y-4 pr-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-navy">Client Information</h3>
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
                <Label className="text-xs">Procedure Types</Label>
                <Input value={fields.procedure_types} onChange={e => setFields(f => ({ ...f, procedure_types: e.target.value }))} className="mt-1 text-sm" />
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold text-navy">Scope Exclusions</h3>
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
              <h3 className="text-sm font-semibold text-navy">Financial</h3>
              <div>
                <Label className="text-xs">Engagement Fee</Label>
                <Input type="number" value={fields.engagement_fee} onChange={e => setFields(f => ({ ...f, engagement_fee: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Deposit (50%)</Label>
                  <Input type="number" value={deposit} disabled className="mt-1 text-sm bg-secondary" />
                </div>
                <div>
                  <Label className="text-xs">Balance (50%)</Label>
                  <Input type="number" value={balance} disabled className="mt-1 text-sm bg-secondary" />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold text-navy">Timeline & Location</h3>
              <div>
                <Label className="text-xs">Proposed Kickoff Date</Label>
                <Input type="date" value={fields.kickoff_date} onChange={e => setFields(f => ({ ...f, kickoff_date: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Delivery Target (auto-calc: 15 biz days)</Label>
                <Input type="date" value={deliveryTarget} disabled className="mt-1 text-sm bg-secondary" />
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
            <SowPreview fields={fields} deposit={deposit} balance={balance} deliveryTarget={deliveryTarget} settings={settings} />
          </div>
        </div>

        <div className="border-t p-6 flex justify-end gap-3 bg-secondary/30">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={loading} className="bg-cobalt hover:bg-cobalt/90">
            {loading ? 'Generating…' : 'Generate Service Agreement'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SowPreview({ fields, deposit, balance, deliveryTarget, settings }) {
  const exclusionsList = fields.scope_exclusions.map((e, i) => `<li>${e}</li>`).join('\n');

  return (
    <div className="bg-gray-50 p-8 rounded-lg space-y-4 font-inter text-sm" style={{ fontSize: '11px', lineHeight: 1.6 }}>
      <div className="text-center space-y-1">
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0A2540' }}>Service Agreement</h1>
        <p style={{ fontSize: '10px', color: '#475569' }}>{settings?.practice_name || 'ALS Professional Services GA'}</p>
        <p style={{ fontSize: '10px', color: '#475569' }}>Generated {new Date().toLocaleDateString()}</p>
      </div>

      <div style={{ borderTop: '2px solid #1DE9B6', paddingTop: '12px', marginTop: '16px' }} />

      <div>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>Section 1 — Parties</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
          <div><strong>Provider:</strong> {settings?.practice_name || 'ALS Professional Services GA'}</div>
          <div><strong>Client Facility:</strong> {fields.client_name}</div>
          <div><strong>Administrator:</strong> {fields.admin_name}, {fields.admin_title}</div>
          <div><strong>Address:</strong> {fields.facility_address}</div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>Section 2 — Scope of Services</h2>
        <p style={{ fontSize: '10px' }}>Provider will conduct a comprehensive supply chain diagnostic for the Client's surgical facility, focusing on: <strong>{fields.procedure_types}</strong>.</p>
      </div>

      {exclusionsList && (
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>Section 3 — Scope Exclusions</h2>
          <ul style={{ fontSize: '10px', marginLeft: '16px' }} dangerouslySetInnerHTML={{ __html: exclusionsList }} />
        </div>
      )}

      <div>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>Section 4 — Engagement Fee & Payment</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
          <div><strong>Total Fee:</strong> ${parseFloat(fields.engagement_fee).toLocaleString()}</div>
          <div><strong>Deposit (50%):</strong> ${deposit.toLocaleString()}</div>
          <div><strong>Balance (50%):</strong> ${balance.toLocaleString()}</div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>Section 5 — Timeline</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
          <div><strong>Kickoff:</strong> {fields.kickoff_date}</div>
          <div><strong>On-Site:</strong> {fields.onsite_date || 'TBD'}</div>
          <div><strong>Delivery Target:</strong> {deliveryTarget || 'TBD'}</div>
        </div>
      </div>

      <div style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          <Lock className="w-3 h-3" /> Fixed per practice policy
        </div>
        <h2 style={{ fontSize: '11px', fontWeight: 'bold', color: '#0A2540', marginBottom: '6px' }}>Section 6 — Savings Guarantee</h2>
        <p style={{ fontSize: '10px', color: '#1E293B' }}>{settings?.sow_section_6_text || '[GUARANTEE LANGUAGE NOT CONFIGURED]'}</p>
      </div>

      <div>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>Section 7 — Governing Law</h2>
        <p style={{ fontSize: '10px' }}>This Agreement shall be governed by the laws of the State of Georgia, {fields.governing_county}.</p>
      </div>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', fontSize: '9px' }}>
          <div><div style={{ borderBottom: '1px solid #0A2540', marginBottom: '4px', height: '32px' }} /><div>{fields.admin_name}</div><div>{fields.client_name}</div></div>
          <div><div style={{ borderBottom: '1px solid #0A2540', marginBottom: '4px', height: '32px' }} /><div>{settings?.founder_name || 'Founder'}</div><div>{settings?.practice_name || 'ALS Professional Services GA'}</div></div>
        </div>
      </div>
    </div>
  );
}