import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Search, Mail, Phone } from "lucide-react";
import { format } from "date-fns";

const RegistrationsManagement = () => {
  const { role, churchId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: events } = useQuery({
    queryKey: ["admin-events-list", role, churchId],
    queryFn: async () => {
      let query = supabase.from("events").select("id, title").order("event_date", { ascending: false });
      if (role === "church_admin" && churchId) {
        query = query.eq("church_id", churchId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["admin-registrations", selectedEvent, role, churchId],
    queryFn: async () => {
      let query = supabase
        .from("registrations")
        .select("*, events(title, event_date, church_id)")
        .order("created_at", { ascending: false });

      if (selectedEvent !== "all") {
        query = query.eq("event_id", selectedEvent);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by church if church admin
      if (role === "church_admin" && churchId) {
        return data.filter((reg) => (reg.events as any)?.church_id === churchId);
      }

      return data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ registrationId, checkedIn }: { registrationId: string; checkedIn: boolean }) => {
      const { error } = await supabase
        .from("registrations")
        .update({
          checked_in: checkedIn,
          checked_in_at: checkedIn ? new Date().toISOString() : null,
        })
        .eq("id", registrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
      toast({
        title: "Check-in updated",
        description: "The registration has been updated.",
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

  const filteredRegistrations = registrations?.filter((reg) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      reg.attendee_name.toLowerCase().includes(term) ||
      reg.attendee_email.toLowerCase().includes(term) ||
      reg.attendee_phone?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "free":
        return <Badge variant="secondary">Free</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
      <h1 className="text-3xl font-bold text-primary mb-8">Registrations</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events?.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredRegistrations?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No registrations found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRegistrations?.map((reg) => (
            <Card key={reg.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {reg.attendee_name}
                      {reg.checked_in && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {(reg.events as any)?.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(reg.registration_status)}
                    {getPaymentBadge(reg.payment_status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {reg.attendee_email}
                  </span>
                  {reg.attendee_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {reg.attendee_phone}
                    </span>
                  )}
                  <span>
                    🎟️ {reg.num_tickets} ticket{reg.num_tickets > 1 ? "s" : ""}
                  </span>
                  {reg.total_amount > 0 && (
                    <span>💰 ${reg.total_amount.toFixed(2)}</span>
                  )}
                  <span>
                    📅 Registered {format(new Date(reg.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={reg.checked_in ? "outline" : "default"}
                    onClick={() =>
                      checkInMutation.mutate({
                        registrationId: reg.id,
                        checkedIn: !reg.checked_in,
                      })
                    }
                  >
                    {reg.checked_in ? (
                      <>
                        <XCircle className="mr-1 h-4 w-4" />
                        Undo Check-in
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Check In
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegistrationsManagement;
