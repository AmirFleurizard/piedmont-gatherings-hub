import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus("invalid");
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already_unsubscribed");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already_unsubscribed");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  const content: Record<Status, React.ReactNode> = {
    loading: (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Validating your request...</p>
      </div>
    ),
    valid: (
      <div className="flex flex-col items-center gap-4 py-8">
        <AlertTriangle className="h-10 w-10 text-secondary" />
        <p className="text-center text-muted-foreground">
          Are you sure you want to unsubscribe? You will no longer receive event-related emails.
        </p>
        <Button onClick={handleUnsubscribe} disabled={processing} variant="destructive">
          {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm Unsubscribe
        </Button>
      </div>
    ),
    already_unsubscribed: (
      <div className="flex flex-col items-center gap-4 py-8">
        <CheckCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">You've already been unsubscribed.</p>
      </div>
    ),
    success: (
      <div className="flex flex-col items-center gap-4 py-8">
        <CheckCircle className="h-10 w-10 text-accent" />
        <p className="text-muted-foreground">You've been successfully unsubscribed.</p>
      </div>
    ),
    invalid: (
      <div className="flex flex-col items-center gap-4 py-8">
        <XCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">This unsubscribe link is invalid or expired.</p>
      </div>
    ),
    error: (
      <div className="flex flex-col items-center gap-4 py-8">
        <XCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Something went wrong. Please try again later.</p>
      </div>
    ),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Email Preferences</CardTitle>
          </CardHeader>
          <CardContent>{content[status]}</CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
