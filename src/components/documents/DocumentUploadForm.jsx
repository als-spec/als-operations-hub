import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2 } from 'lucide-react';

export default function DocumentUploadForm({ user, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    category: 'Other',
    linked_record_type: '',
    linked_record_id: '',
    linked_record_name: '',
    notes: '',
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: prospects = [] } = useQuery({ queryKey: ['prospects'], queryFn: () => base44.entities.Prospect.list() });
  const { data: engagements = [] } = useQuery({ queryKey: ['engagements'], queryFn: () => base44.entities.Engagement.list() });
  const { data: retainers = [] } = useQuery({ queryKey: ['retainers'], queryFn: () => base44.entities.Retainer.list() });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const linkedOptions = {
    prospect: prospects.map(p => ({ id: p.id, name: p.facility_name })),
    engagement: engagements.map(e => ({ id: e.id, name: e.facility_name })),
    retainer: retainers.map(r => ({ id: r.id, name: r.facility_name })),
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      if (!form.name) set('name', f.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Document.create({
      ...form,
      file_url,
      file_name: file.name,
      file_size_kb: Math.round(file.size / 1024),
      uploaded_by: user?.email || '',
    });
    setUploading(false);
    onSuccess();
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Upload Document</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Document Name *</Label>
              <Input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Proposal – General Surgery ASC" />
            </div>
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['SOW','Proposal','Report','Contract','Invoice','Presentation','Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Link To (optional)</Label>
              <Select value={form.linked_record_type || 'none'} onValueChange={v => { set('linked_record_type', v === 'none' ? '' : v); set('linked_record_id', ''); set('linked_record_name', ''); }}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="retainer">Retainer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.linked_record_type && (
              <div className="space-y-1">
                <Label>Select Record</Label>
                <Select value={form.linked_record_id} onValueChange={v => {
                  const rec = (linkedOptions[form.linked_record_type] || []).find(r => r.id === v);
                  set('linked_record_id', v);
                  set('linked_record_name', rec?.name || '');
                }}>
                  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>
                    {(linkedOptions[form.linked_record_type] || []).map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>File *</Label>
            <Input type="file" required onChange={handleFileChange} />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={uploading || !file} className="gap-2">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Upload className="w-4 h-4" />Upload</>}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}