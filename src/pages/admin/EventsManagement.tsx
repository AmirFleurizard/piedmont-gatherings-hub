import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

const EventsManagement = () => {
  const { role, churchId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const { data: churches } = useQuery({
    queryKey: ["churches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("churches").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events", role, churchId],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*, churches(name)")
        .order("event_date", { ascending: true });

      if (role === "church_admin" && churchId) {
        query = query.eq("church_id", churchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const eventData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        location: formData.get("location") as string,
        event_date: formData.get("event_date") as string,
        end_date: formData.get("end_date") as string || null,
        capacity: parseInt(formData.get("capacity") as string) || 100,
        spots_remaining: editingEvent 
          ? editingEvent.spots_remaining 
          : parseInt(formData.get("capacity") as string) || 100,
        is_free: formData.get("is_free") === "true",
        price: formData.get("is_free") === "true" ? 0 : parseFloat(formData.get("price") as string) || 0,
        is_published: formData.get("is_published") === "true",
        church_id: formData.get("church_id") as string,
        image_url: formData.get("image_url") as string || null,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(eventData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({
        title: editingEvent ? "Event updated" : "Event created",
        description: `The event has been ${editingEvent ? "updated" : "created"} successfully.`,
      });
      setIsDialogOpen(false);
      setEditingEvent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ eventId, isPublished }: { eventId: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from("events")
        .update({ is_published: isPublished })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveMutation.mutate(formData);
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary">Events</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Event" : "Create New Event"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingEvent?.title}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="church_id">Church</Label>
                  <Select
                    name="church_id"
                    defaultValue={editingEvent?.church_id || (role === "church_admin" ? churchId || undefined : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a church" />
                    </SelectTrigger>
                    <SelectContent>
                      {churches?.map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingEvent?.description || ""}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editingEvent?.location}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Start Date & Time</Label>
                  <Input
                    id="event_date"
                    name="event_date"
                    type="datetime-local"
                    defaultValue={
                      editingEvent?.event_date
                        ? format(new Date(editingEvent.event_date), "yyyy-MM-dd'T'HH:mm")
                        : ""
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date & Time (optional)</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="datetime-local"
                    defaultValue={
                      editingEvent?.end_date
                        ? format(new Date(editingEvent.end_date), "yyyy-MM-dd'T'HH:mm")
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min={1}
                    defaultValue={editingEvent?.capacity || 100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL (optional)</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    type="url"
                    defaultValue={editingEvent?.image_url || ""}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_free"
                    name="is_free"
                    defaultChecked={editingEvent?.is_free ?? true}
                    onCheckedChange={(checked) => {
                      const priceInput = document.getElementById("price") as HTMLInputElement;
                      if (priceInput) {
                        priceInput.disabled = checked;
                        if (checked) priceInput.value = "0";
                      }
                    }}
                  />
                  <input type="hidden" name="is_free" value="false" />
                  <Label htmlFor="is_free">Free Event</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_published"
                    name="is_published"
                    defaultChecked={editingEvent?.is_published ?? false}
                  />
                  <input type="hidden" name="is_published" value="false" />
                  <Label htmlFor="is_published">Published</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step={0.01}
                  defaultValue={editingEvent?.price || 0}
                  disabled={editingEvent?.is_free ?? true}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save Event"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {events?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No events yet</p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events?.map((event) => (
            <Card key={event.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {event.title}
                      {!event.is_published && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(event as any).churches?.name} • {event.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        togglePublishMutation.mutate({
                          eventId: event.id,
                          isPublished: !event.is_published,
                        })
                      }
                      title={event.is_published ? "Unpublish" : "Publish"}
                    >
                      {event.is_published ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this event?")) {
                          deleteMutation.mutate(event.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>
                    📅 {format(new Date(event.event_date), "MMM d, yyyy h:mm a")}
                  </span>
                  <span>
                    👥 {event.spots_remaining}/{event.capacity} spots
                  </span>
                  <span>
                    💰 {event.is_free ? "Free" : `$${event.price}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsManagement;
