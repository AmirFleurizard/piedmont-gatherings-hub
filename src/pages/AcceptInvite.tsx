import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface InviteDetails {
  id: string;
  email: string;
  full_name: string | null;
  role: "county_admin" | "church_admin";
  church_id: string | null;
  expires_at: string;
  accepted_at: string | null;
}

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) {
        setError("No invitation token provided.");
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("pending_invites")
        .select("id, email, full_name, role, church_id, expires_at, accepted_at")
        .eq("invite_token", token)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching invite:", fetchError);
        setError("Failed to load invitation. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!data) {
        setError("This invitation link is invalid or has expired.");
        setIsLoading(false);
        return;
      }

      if (data.accepted_at) {
        setError("This invitation has already been used.");
        setIsLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("This invitation has expired. Please request a new one.");
        setIsLoading(false);
        return;
      }

      setInvite(data as InviteDetails);
      setFullName(data.full_name || "");
      setIsLoading(false);
    };

    fetchInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invite) return;

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the user account
      const redirectUrl = `${window.location.origin}/`;
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Wait a moment for the trigger to create the profile
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create the user role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: invite.role,
        church_id: invite.role === "church_admin" ? invite.church_id : null,
      });

      if (roleError) {
        console.error("Error creating user role:", roleError);
        // Don't throw - the account was created, role can be assigned manually
      }

      // Mark the invite as accepted
      const { error: updateError } = await supabase
        .from("pending_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);

      if (updateError) {
        console.error("Error updating invite:", updateError);
        // Don't throw - the account was created
      }

      setSuccess(true);

      toast({
        title: "Account created!",
        description: "Your account has been created successfully. You can now log in.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      console.error("Error creating account:", err);
      toast({
        title: "Failed to create account",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleName = () => {
    if (!invite) return "";
    return invite.role === "county_admin" ? "County Administrator" : "Church Administrator";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          {isLoading ? (
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading invitation...</p>
            </CardContent>
          ) : error ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
                <CardTitle className="text-xl">Invalid Invitation</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardFooter className="justify-center">
                <Button variant="outline" onClick={() => navigate("/")}>
                  Go to Homepage
                </Button>
              </CardFooter>
            </>
          ) : success ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <CardTitle className="text-xl">Account Created!</CardTitle>
                <CardDescription>
                  Your account has been created successfully. Redirecting to login...
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-primary">Accept Invitation</CardTitle>
                <CardDescription>
                  You've been invited to join as a <strong>{getRoleName()}</strong>
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-muted p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Complete the form below to create your account for{" "}
                      <strong>{invite?.email}</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={invite?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Repeat your password"
                    />
                  </div>
                </CardContent>

                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default AcceptInvite;
