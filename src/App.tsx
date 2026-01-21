import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Staff from "./pages/Staff";
import Churches from "./pages/Churches";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import Overview from "./pages/admin/Overview";
import EventsManagement from "./pages/admin/EventsManagement";
import ChurchesManagement from "./pages/admin/ChurchesManagement";
import RegistrationsManagement from "./pages/admin/RegistrationsManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/churches" element={<Churches />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Dashboard />}>
              <Route index element={<Overview />} />
              <Route path="events" element={<EventsManagement />} />
              <Route path="churches" element={<ChurchesManagement />} />
              <Route path="registrations" element={<RegistrationsManagement />} />
              <Route path="users" element={<UsersManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
