import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvoiceList from '@/components/financials/InvoiceList';
import InvoiceForm from '@/components/financials/InvoiceForm';
import ARAgingTable from '@/components/financials/ARAgingTable';
import RevenueForecast from '@/components/financials/RevenueForecast';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function Financials() {
  const { user } = useCurrentUser();
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const queryClient = useQueryClient();

  const isFounder = user?.role === 'admin' || user?.email?.includes('founder');

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 200),
  });

  const { data: retainers = [] } = useQuery({
    queryKey: ['retainers'],
    queryFn: () => base44.entities.Retainer.list(),
  });

  const { data: pipeline = [] } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => base44.entities.PipelineRecord.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowForm(false); setEditingInvoice(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowForm(false); setEditingInvoice(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const handleSubmit = (data) => {
    if (editingInvoice) updateMutation.mutate({ id: editingInvoice.id, data });
    else createMutation.mutate(data);
  };

  const handleEdit = (invoice) => { setEditingInvoice(invoice); setShowForm(true); };
  const handleNew = () => { setEditingInvoice(null); setShowForm(true); };

  // KPIs
  const totalMRR = retainers.filter(r => r.status === 'Active').reduce((s, r) => s + (r.mrr || 0), 0);
  const paidThisYear = invoices.filter(i => i.status === 'Paid' && i.paid_date?.startsWith(new Date().getFullYear().toString())).reduce((s, i) => s + (i.amount || 0), 0);
  const outstanding = invoices.filter(i => ['Sent', 'Overdue'].includes(i.status)).reduce((s, i) => s + (i.amount || 0), 0);
  const overdueCount = invoices.filter(i => i.status === 'Overdue' || (i.status === 'Sent' && i.due_date && differenceInDays(new Date(), parseISO(i.due_date)) > 0)).length;

  if (!isFounder) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-warning" />
        <p className="font-medium">Access restricted to founders.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financials</h1>
          <p className="text-sm text-muted-foreground">Revenue tracking, invoices & accounts receivable</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="w-4 h-4" /> New Invoice
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><DollarSign className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly MRR</p>
                <p className="text-xl font-bold">${totalMRR.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg"><TrendingUp className="w-5 h-5 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Collected YTD</p>
                <p className="text-xl font-bold">${paidThisYear.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg"><Clock className="w-5 h-5 text-warning" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding AR</p>
                <p className="text-xl font-bold">${outstanding.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg"><AlertCircle className="w-5 h-5 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue Invoices</p>
                <p className="text-xl font-bold">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingInvoice(null); }}
        />
      )}

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="ar">AR Aging</TabsTrigger>
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <InvoiceList invoices={invoices} onEdit={handleEdit} onDelete={(id) => deleteMutation.mutate(id)} onStatusChange={(id, status) => updateMutation.mutate({ id, data: { status, ...(status === 'Paid' ? { paid_date: new Date().toISOString().split('T')[0] } : {}) } })} />
        </TabsContent>
        <TabsContent value="ar" className="mt-4">
          <ARAgingTable invoices={invoices} />
        </TabsContent>
        <TabsContent value="forecast" className="mt-4">
          <RevenueForecast pipeline={pipeline} retainers={retainers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}