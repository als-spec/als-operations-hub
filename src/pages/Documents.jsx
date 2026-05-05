import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Download, Trash2, Upload, Link2 } from 'lucide-react';
import DocumentUploadForm from '@/components/documents/DocumentUploadForm';
import { format } from 'date-fns';

const CATEGORY_COLORS = {
  SOW: 'bg-primary/10 text-primary',
  Proposal: 'bg-purple-100 text-purple-700',
  Report: 'bg-teal/10 text-teal-700',
  Contract: 'bg-warning/10 text-warning',
  Invoice: 'bg-success/10 text-success',
  Presentation: 'bg-pink-100 text-pink-700',
  Other: 'bg-secondary text-secondary-foreground',
};

export default function Documents() {
  const { user } = useCurrentUser();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date', 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const filtered = useMemo(() => {
    return documents.filter(d => {
      const matchSearch = !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.linked_record_name?.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'all' || d.category === filterCategory;
      const matchType = filterType === 'all' || d.linked_record_type === filterType;
      return matchSearch && matchCat && matchType;
    });
  }, [documents, search, filterCategory, filterType]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Library</h1>
          <p className="text-sm text-muted-foreground">{documents.length} documents stored</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Upload className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      {showForm && (
        <DocumentUploadForm
          user={user}
          onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['documents'] }); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {['SOW','Proposal','Report','Contract','Invoice','Presentation','Other'].map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Linked To" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="engagement">Engagement</SelectItem>
            <SelectItem value="retainer">Retainer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document Grid */}
      {filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No documents found.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-medium text-sm truncate">{doc.name}</span>
                  </div>
                  <Badge className={`text-xs shrink-0 ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.Other}`}>{doc.category}</Badge>
                </div>
                {doc.linked_record_name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Link2 className="w-3 h-3" />
                    <span className="capitalize">{doc.linked_record_type}</span>: {doc.linked_record_name}
                  </div>
                )}
                {doc.notes && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{doc.notes}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    {doc.created_date ? format(new Date(doc.created_date), 'MMM d, yyyy') : ''}
                    {doc.file_size_kb ? ` · ${doc.file_size_kb}KB` : ''}
                  </span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" asChild className="h-7 w-7 p-0">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-3.5 h-3.5" /></a>
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(doc.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}