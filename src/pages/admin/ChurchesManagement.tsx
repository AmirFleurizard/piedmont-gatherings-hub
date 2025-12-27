import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MapPin, Phone, Globe } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Church = Tables<"churches">;

const ChurchesManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChurch, setEditingChurch] = useState<Church | null>(null);

  const { data: churches, isLoading } = useQuery({
    queryKey: ["admin-churches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("churches").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const churchData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string || null,
        location: formData.get("location") as string || null,
        pastor: formData.get("pastor") as string || null,
        phone: formData.get("phone") as string || null,
        website: formData.get("website") as string || null,
      };

      if (editingChurch) {
        const { error } = await supabase
          .from("churches")
          .update(churchData)
          .eq("id", editingChurch.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("churches").insert(churchData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-churches"] });
      toast({
        title: editingChurch ? "Church updated" : "Church created",
        description: `The church has been ${editingChurch ? "updated" : "created"} successfully.`,
      });
      setIsDialogOpen(false);
      setEditingChurch(null);
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
    mutationFn: async (churchId: string) => {
      const { error } = await supabase.from("churches").delete().eq("id", churchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-churches"] });
      toast({
        title: "Church deleted",
        description: "The church has been deleted successfully.",
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveMutation.mutate(formData);
  };

  const openEditDialog = (church: Church) => {
    setEditingChurch(church);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingChurch(null);
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
        <h1 className="text-3xl font-bold text-primary">Churches</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Church
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingChurch ? "Edit Church" : "Add New Church"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Church Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingChurch?.name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pastor">Pastor</Label>
                <Input
                  id="pastor"
                  name="pastor"
                  defaultValue={editingChurch?.pastor || ""}
                  placeholder="Pastor John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingChurch?.description || ""}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editingChurch?.location || ""}
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={editingChurch?.phone || ""}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    defaultValue={editingChurch?.website || ""}
                    placeholder="https://example.com"
                  />
                </div>
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
                  {saveMutation.isPending ? "Saving..." : "Save Church"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {churches?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No churches yet</p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Church
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {churches?.map((church) => (
            <Card key={church.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{church.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(church)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this church? This will also delete all associated events.")) {
                          deleteMutation.mutate(church.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {church.pastor && (
                  <p className="text-sm text-muted-foreground">{church.pastor}</p>
                )}
              </CardHeader>
              <CardContent>
                {church.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {church.description}
                  </p>
                )}
                <div className="space-y-1 text-sm">
                  {church.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{church.location}</span>
                    </div>
                  )}
                  {church.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{church.phone}</span>
                    </div>
                  )}
                  {church.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a
                        href={church.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-accent"
                      >
                        {church.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChurchesManagement;
