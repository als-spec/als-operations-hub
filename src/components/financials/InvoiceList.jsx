import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_COLORS = {
  Draft: 'bg-secondary text-secondary-foreground',
  Sent: 'bg-primary/10 text-primary',
  Paid: 'bg-success/10 text-success',
  Overdue: 'bg-destructive/10 text-destructive',
  Void: 'bg-muted text-muted-foreground',
};

export default function InvoiceList({ invoices, prospects = [], onEdit, onDelete, onStatusChange }) {
  const prospectMap = Object.fromEntries(prospects.map(p => [p.id, p.facility_name]));
  if (!invoices.length) return (
    <div className="text-center py-12 text-muted-foreground">No invoices yet. Create your first invoice above.</div>
  );

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>Invoice #</TableHead>
            <TableHead>Facility</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map(inv => (
            <TableRow key={inv.id} className="hover:bg-muted/20">
              <TableCell className="font-mono text-sm">{inv.invoice_number || '—'}</TableCell>
              <TableCell className="font-medium">{inv.prospect_id ? prospectMap[inv.prospect_id] : inv.facility_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{inv.invoice_type}</TableCell>
              <TableCell className="font-semibold">${(inv.amount || 0).toLocaleString()}</TableCell>
              <TableCell className="text-sm">{inv.issue_date ? format(parseISO(inv.issue_date), 'MMM d, yyyy') : '—'}</TableCell>
              <TableCell className="text-sm">{inv.due_date ? format(parseISO(inv.due_date), 'MMM d, yyyy') : '—'}</TableCell>
              <TableCell>
                <Badge className={`text-xs ${STATUS_COLORS[inv.status] || STATUS_COLORS.Draft}`}>{inv.status}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(inv)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                    {inv.status !== 'Paid' && (
                      <DropdownMenuItem onClick={() => onStatusChange(inv.id, 'Paid')} className="text-success">
                        <CheckCircle className="w-4 h-4 mr-2" />Mark Paid
                      </DropdownMenuItem>
                    )}
                    {inv.status === 'Draft' && (
                      <DropdownMenuItem onClick={() => onStatusChange(inv.id, 'Sent')}>
                        Mark Sent
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDelete(inv.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}