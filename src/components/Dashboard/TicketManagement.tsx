import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Edit2, Trash2, Eye, Filter, Plus } from "lucide-react";

interface SupportTicket {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
}

interface TicketManagementProps {
  tickets: SupportTicket[];
  onCreateTicket: (title: string, description: string, priority?: string) => Promise<unknown>;
  onUpdateTicket: (ticketId: string, updates: { status?: string; priority?: string; title?: string; description?: string }) => Promise<boolean>;
  onDeleteTicket: (ticketId: string) => Promise<boolean>;
}

const statusOptions = [
  { value: "open", label: "Open", color: "bg-yellow-500" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { value: "resolved", label: "Resolved", color: "bg-green-500" },
  { value: "closed", label: "Closed", color: "bg-gray-500" },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700" },
];

export const TicketManagement = ({ tickets, onCreateTicket, onUpdateTicket, onDeleteTicket }: TicketManagementProps) => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", status: "", priority: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New ticket form state
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  const filteredTickets = tickets.filter((ticket) => {
    const statusMatch = filterStatus === "all" || ticket.status === filterStatus;
    const priorityMatch = filterPriority === "all" || ticket.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setEditForm({
      title: ticket.title,
      description: ticket.description || "",
      status: ticket.status,
      priority: ticket.priority,
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedTicket) return;
    
    setIsSubmitting(true);
    const success = await onUpdateTicket(selectedTicket.id, editForm);
    setIsSubmitting(false);
    
    if (success) {
      toast.success("Ticket updated successfully");
      setSelectedTicket(null);
      setIsEditing(false);
    } else {
      toast.error("Failed to update ticket");
    }
  };

  const handleQuickStatusChange = async (ticketId: string, newStatus: string) => {
    const success = await onUpdateTicket(ticketId, { status: newStatus });
    if (success) {
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } else {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (ticketId: string) => {
    const success = await onDeleteTicket(ticketId);
    if (success) {
      toast.success("Ticket deleted");
      setSelectedTicket(null);
    } else {
      toast.error("Failed to delete ticket");
    }
  };

  const handleCreateTicket = async () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a ticket title");
      return;
    }

    setIsSubmitting(true);
    const result = await onCreateTicket(newTitle, newDescription, newPriority);
    setIsSubmitting(false);

    if (result) {
      toast.success("Ticket created successfully!");
      setNewTicketOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewPriority("medium");
    } else {
      toast.error("Failed to create ticket");
    }
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || "bg-gray-500";
  };

  const getPriorityStyle = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.color || "bg-gray-100 text-gray-700";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Ticket Management</CardTitle>
            <CardDescription>View, edit, and manage your support tickets</CardDescription>
          </div>
          <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Support Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <Input 
                    placeholder="Brief description of the issue"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Priority</label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea 
                    placeholder="Provide more details..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreateTicket} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTickets.length > 0 ? (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors group"
              >
                <div className={`w-3 h-3 rounded-full shrink-0 ${getStatusColor(ticket.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{ticket.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{ticket.description || 'No description'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityStyle(ticket.priority)}`}>
                  {ticket.priority}
                </span>
                <Select 
                  value={ticket.status} 
                  onValueChange={(value) => handleQuickStatusChange(ticket.id, value)}
                >
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewTicket(ticket)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Ticket" : "Ticket Details"}</DialogTitle>
                      </DialogHeader>
                      {selectedTicket && (
                        <div className="space-y-4 pt-4">
                          {isEditing ? (
                            <>
                              <div>
                                <label className="text-sm font-medium">Title</label>
                                <Input 
                                  value={editForm.title}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Priority</label>
                                  <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {priorityOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea 
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  rows={4}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Title</label>
                                <p className="text-foreground">{selectedTicket.title}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedTicket.status)}`} />
                                    <span className="capitalize">{selectedTicket.status.replace('_', ' ')}</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                                  <div className="mt-1">
                                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityStyle(selectedTicket.priority)}`}>
                                      {selectedTicket.priority}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <p className="text-foreground">{selectedTicket.description || 'No description provided'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Created</label>
                                <p className="text-foreground">
                                  {new Date(selectedTicket.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </>
                          )}
                          <DialogFooter className="gap-2 sm:gap-0">
                            {isEditing ? (
                              <>
                                <Button variant="outline" onClick={() => setIsEditing(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleSaveEdit} disabled={isSubmitting}>
                                  {isSubmitting ? "Saving..." : "Save Changes"}
                                </Button>
                              </>
                            ) : (
                              <>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the ticket.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(selectedTicket.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <Button onClick={() => setIsEditing(true)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                              </>
                            )}
                          </DialogFooter>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No tickets found</p>
            <p className="text-sm">
              {tickets.length === 0 
                ? "Create your first ticket to get started" 
                : "Try adjusting your filters"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};