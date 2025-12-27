import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Church, Users, DollarSign } from "lucide-react";

const Overview = () => {
  const { role, churchId } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats", role, churchId],
    queryFn: async () => {
      let eventsQuery = supabase.from("events").select("id, is_published", { count: "exact" });
      let churchesQuery = supabase.from("churches").select("id", { count: "exact" });
      let registrationsQuery = supabase.from("registrations").select("id, total_amount", { count: "exact" });

      if (role === "church_admin" && churchId) {
        eventsQuery = eventsQuery.eq("church_id", churchId);
      }

      const [eventsRes, churchesRes, registrationsRes] = await Promise.all([
        eventsQuery,
        churchesQuery,
        registrationsQuery,
      ]);

      const totalRevenue = registrationsRes.data?.reduce(
        (sum, reg) => sum + (reg.total_amount || 0),
        0
      ) || 0;

      return {
        totalEvents: eventsRes.count || 0,
        publishedEvents: eventsRes.data?.filter((e) => e.is_published).length || 0,
        totalChurches: churchesRes.count || 0,
        totalRegistrations: registrationsRes.count || 0,
        totalRevenue,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-8">Dashboard Overview</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
            <Calendar className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.publishedEvents} published
            </p>
          </CardContent>
        </Card>

        {role === "county_admin" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Churches
              </CardTitle>
              <Church className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalChurches}</div>
              <p className="text-xs text-muted-foreground mt-1">
                In the district
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registrations
            </CardTitle>
            <Users className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total attendees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${stats?.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From paid events
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Welcome to the Piedmont Connect Admin Dashboard. Here's what you can do:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Events:</strong> Create and manage events, set capacity and pricing
              </li>
              {role === "county_admin" && (
                <li>
                  <strong className="text-foreground">Churches:</strong> Add and manage churches in the district
                </li>
              )}
              <li>
                <strong className="text-foreground">Registrations:</strong> View and manage event registrations, check-in attendees
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
