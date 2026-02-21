import { useState, useRef } from "react";
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
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, X } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

const EventsManagement = () => {
  const { role, churchId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasUnlimitedCapacity, setHasUnlimitedCapacity] = useState(false);
  const [isFree, setIsFree] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `events/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("event-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("event-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

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
      setIsUploading(true);
      
      let imageUrl = editingEvent?.image_url || null;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const capacity = hasUnlimitedCapacity ? 999999 : (parseInt(formData.get("capacity") as string) || 100);
      const externalUrl = formData.get("external_registration_url") as string;

      // Convert datetime-local values to ISO strings with timezone offset
      // so the database stores the intended local time correctly
      const toISOWithOffset = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toISOString();
      };

      const rawEventDate = formData.get("event_date") as string;
      const rawEndDate = formData.get("end_date") as string;

      const eventData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        location: formData.get("location") as string,
        event_date: toISOWithOffset(rawEventDate),
        end_date: rawEndDate ? toISOWithOffset(rawEndDate) : null,
        capacity: capacity,
        spots_remaining: editingEvent 
          ? editingEvent.spots_remaining 
          : capacity,
        has_unlimited_capacity: hasUnlimitedCapacity,
        is_free: isFree,
        price: isFree ? 0 : parseFloat(formData.get("price") as string) || 0,
        is_published: isPublished,
        church_id: formData.get("church_id") as string,
        image_url: imageUrl,
        external_registration_url: externalUrl || null,
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
      setImageFile(null);
      setImagePreview(null);
      setIsUploading(false);
    },
    onError: (error: Error) => {
      setIsUploading(false);
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
    setImagePreview(event.image_url || null);
    setImageFile(null);
    setHasUnlimitedCapacity(event.has_unlimited_capacity);
    setIsFree(event.is_free);
    setIsPublished(event.is_published);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    setImageFile(null);
    setImagePreview(null);
    setHasUnlimitedCapacity(false);
    setIsFree(true);
    setIsPublished(false);
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
          <DialogContent key={editingEvent?.id || "new"} className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Switch
                    id="has_unlimited_capacity"
                    checked={hasUnlimitedCapacity}
                    onCheckedChange={setHasUnlimitedCapacity}
                  />
                  <Label htmlFor="has_unlimited_capacity">Unlimited Capacity</Label>
                </div>
                {!hasUnlimitedCapacity && (
                  <>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      min={1}
                      defaultValue={editingEvent?.capacity || 100}
                    />
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="external_registration_url">External Registration URL (optional)</Label>
                <Input
                  id="external_registration_url"
                  name="external_registration_url"
                  type="url"
                  placeholder="https://example.com/register"
                  defaultValue={editingEvent?.external_registration_url || ""}
                />
                <p className="text-xs text-muted-foreground">
                  If set, the registration button will link to this URL instead of the built-in form.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Event Image (optional)</Label>
                <div className="flex flex-col gap-3">
                  {imagePreview ? (
                    <div className="relative w-full max-w-xs">
                      <img 
                        src={imagePreview} 
                        alt="Event preview" 
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={clearImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="w-full max-w-xs h-32 border-2 border-dashed border-muted-foreground/25 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {!imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_free"
                    checked={isFree}
                    onCheckedChange={setIsFree}
                  />
                  <Label htmlFor="is_free">Free Event</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_published"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label htmlFor="is_published">Published</Label>
                </div>
              </div>

              {!isFree && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min={0}
                    step={0.01}
                    defaultValue={editingEvent?.price || 0}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending || isUploading}>
                  {isUploading ? "Uploading..." : saveMutation.isPending ? "Saving..." : "Save Event"}
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
                    👥 {event.has_unlimited_capacity ? "Unlimited" : `${event.spots_remaining}/${event.capacity} spots`}
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
