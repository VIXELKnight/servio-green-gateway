import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, FileText, Edit, Trash2, Search } from "lucide-react";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string | null;
  created_at: string;
}

interface KnowledgeBaseProps {
  botId: string;
}

export function KnowledgeBase({ botId }: KnowledgeBaseProps) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: ""
  });

  useEffect(() => {
    fetchEntries();
  }, [botId]);

  async function fetchEntries() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("bot_id", botId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching knowledge base:", error);
      toast.error("Failed to load knowledge base");
    } else {
      setEntries(data || []);
    }
    setIsLoading(false);
  }

  async function saveEntry() {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    if (editingEntry) {
      const { error } = await supabase
        .from("knowledge_base")
        .update({
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category.trim() || null
        })
        .eq("id", editingEntry.id);

      if (error) {
        toast.error("Failed to update entry");
        return;
      }
      toast.success("Entry updated");
    } else {
      const { error } = await supabase
        .from("knowledge_base")
        .insert({
          bot_id: botId,
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category.trim() || null
        });

      if (error) {
        toast.error("Failed to create entry");
        return;
      }
      toast.success("Entry created");
    }

    resetForm();
    fetchEntries();
  }

  async function deleteEntry(id: string) {
    const { error } = await supabase
      .from("knowledge_base")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete entry");
    } else {
      toast.success("Entry deleted");
      fetchEntries();
    }
  }

  function resetForm() {
    setFormData({ title: "", content: "", category: "" });
    setEditingEntry(null);
    setIsDialogOpen(false);
  }

  function openEditDialog(entry: KnowledgeEntry) {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category || ""
    });
    setIsDialogOpen(true);
  }

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.category && entry.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = [...new Set(entries.map(e => e.category).filter(Boolean))] as string[];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Edit Entry" : "Add Knowledge Entry"}</DialogTitle>
              <DialogDescription>
                Add FAQs, product info, or company policies for the bot to reference
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="entry-title">Title</Label>
                <Input
                  id="entry-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Return Policy"
                />
              </div>
              <div>
                <Label htmlFor="entry-category">Category (optional)</Label>
                <Input
                  id="entry-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Policies, Products, FAQ"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="entry-content">Content</Label>
                <Textarea
                  id="entry-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="The detailed information the bot should know..."
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={saveEntry}>
                {editingEntry ? "Update" : "Add Entry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">
              {searchQuery ? "No matching entries" : "No Knowledge Base Entries"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery 
                ? "Try a different search term"
                : "Add FAQs, product info, and policies for your bot to reference"}
            </p>
            {!searchQuery && (
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredEntries.map((entry) => (
            <Card key={entry.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{entry.title}</h4>
                      {entry.category && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {entry.content}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(entry)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
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
