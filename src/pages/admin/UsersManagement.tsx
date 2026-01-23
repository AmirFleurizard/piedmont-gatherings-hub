import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  UserPlus,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role?: AppRole | null;
  church_id?: string | null;
  role_id?: string | null;
  church_name?: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  church_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  church_name?: string | null;
}

const UsersManagement = () => {
  const { role, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  // Role management dialog state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [selectedChurchId, setSelectedChurchId] = useState<string>("");

  // Create user dialog state
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createRole, setCreateRole] = useState<AppRole | "">("");
  const [createChurchId, setCreateChurchId] = useState("");
  const [cancelInviteDialogOpen, setCancelInviteDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<PendingInvite | null>(null);

  // Fetch all profiles
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, church_id");

      if (rolesError) throw rolesError;

      const { data: churches, error: churchesError } = await supabase
        .from("churches")
        .select("id, name");

      if (churchesError) throw churchesError;

      const churchMap = new Map(churches?.map((c) => [c.id, c.name]) || []);

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || null,
          church_id: userRole?.church_id || null,
          role_id: userRole?.id || null,
          church_name: userRole?.church_id
            ? churchMap.get(userRole.church_id) || null
            : null,
        };
      });

      return usersWithRoles;
    },
    enabled: role === "county_admin",
  });

  // Fetch pending invites
  const { data: pendingInvites, isLoading: invitesLoading } = useQuery({
    queryKey: ["pending-invites"],
    queryFn: async () => {
      const { data: invites, error: invitesError } = await supabase
        .from("pending_invites")
        .select("id, email, full_name, role, church_id, expires_at, accepted_at, created_at")
        .order("created_at", { ascending: false });

      if (invitesError) throw invitesError;

      const { data: churches, error: churchesError } = await supabase
        .from("churches")
        .select("id, name");

      if (churchesError) throw churchesError;

      const churchMap = new Map(churches?.map((c) => [c.id, c.name]) || []);

      return (invites || []).map((invite) => ({
        ...invite,
        church_name: invite.church_id ? churchMap.get(invite.church_id) || null : null,
      })) as PendingInvite[];
    },
    enabled: role === "county_admin",
  });

  // Fetch churches for dropdown
  const { data: churches } = useQuery({
    queryKey: ["churches-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("churches")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: role === "county_admin",
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      full_name,
      role,
      church_id,
    }: {
      email: string;
      password: string;
      full_name?: string;
      role: AppRole;
      church_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email, password, full_name, role, church_id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User created successfully" });
      setCreateUserDialogOpen(false);
      resetCreateUserForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel invite mutation
  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("pending_invites")
        .delete()
        .eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      toast({ title: "Invitation cancelled" });
      setCancelInviteDialogOpen(false);
      setSelectedInvite(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to cancel invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign or update role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      newRole,
      churchId,
      existingRoleId,
    }: {
      userId: string;
      newRole: AppRole;
      churchId: string | null;
      existingRoleId: string | null;
    }) => {
      if (existingRoleId) {
        const { error } = await supabase
          .from("user_roles")
          .update({
            role: newRole,
            church_id: newRole === "church_admin" ? churchId : null,
          })
          .eq("id", existingRoleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: newRole,
          church_id: newRole === "church_admin" ? churchId : null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Role updated successfully" });
      setRoleDialogOpen(false);
      resetRoleForm();
    },
    onError: (error) => {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Role removed successfully" });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error removing role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetRoleForm = () => {
    setSelectedUser(null);
    setSelectedRole("");
    setSelectedChurchId("");
  };

  const resetCreateUserForm = () => {
    setCreateEmail("");
    setCreatePassword("");
    setCreateFullName("");
    setCreateRole("");
    setCreateChurchId("");
  };

  const openRoleDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedRole(user.role || "");
    setSelectedChurchId(user.church_id || "");
    setRoleDialogOpen(true);
  };

  const handleAssignRole = () => {
    if (!selectedUser || !selectedRole) return;

    if (selectedRole === "church_admin" && !selectedChurchId) {
      toast({
        title: "Church required",
        description: "Please select a church for the church admin role.",
        variant: "destructive",
      });
      return;
    }

    assignRoleMutation.mutate({
      userId: selectedUser.id,
      newRole: selectedRole,
      churchId: selectedRole === "church_admin" ? selectedChurchId : null,
      existingRoleId: selectedUser.role_id || null,
    });
  };

  const openDeleteDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleRemoveRole = () => {
    if (!selectedUser?.role_id) return;
    removeRoleMutation.mutate(selectedUser.role_id);
  };

  const handleCreateUser = () => {
    if (!createEmail || !createPassword || !createRole) {
      toast({
        title: "Missing information",
        description: "Please enter email, password, and select a role.",
        variant: "destructive",
      });
      return;
    }

    if (createPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (createRole === "church_admin" && !createChurchId) {
      toast({
        title: "Church required",
        description: "Please select a church for the church admin role.",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      email: createEmail,
      password: createPassword,
      full_name: createFullName || undefined,
      role: createRole,
      church_id: createRole === "church_admin" ? createChurchId : undefined,
    });
  };

  const openCancelInviteDialog = (invite: PendingInvite) => {
    setSelectedInvite(invite);
    setCancelInviteDialogOpen(true);
  };


  const filteredUsers = users?.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingInvitesFiltered = pendingInvites?.filter(
    (invite) =>
      !invite.accepted_at &&
      (invite.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invite.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadge = (user: UserWithRole) => {
    if (!user.role) {
      return <Badge variant="outline">No Role</Badge>;
    }
    if (user.role === "county_admin") {
      return <Badge className="bg-primary">County Admin</Badge>;
    }
    return (
      <Badge variant="secondary">
        Church Admin{user.church_name && ` - ${user.church_name}`}
      </Badge>
    );
  };

  const getInviteStatus = (invite: PendingInvite) => {
    if (invite.accepted_at) {
      return (
        <Badge className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    }
    if (new Date(invite.expires_at) < new Date()) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (role !== "county_admin") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          You don't have permission to manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setCreateUserDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Users ({users?.length || 0})</TabsTrigger>
          <TabsTrigger value="invites">
            Pending Invites ({pendingInvitesFiltered?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <p className="text-muted-foreground">No users found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.full_name || "-"}</TableCell>
                        <TableCell>{getRoleBadge(user)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleDialog(user)}
                            >
                              {user.role ? (
                                <Edit className="h-4 w-4" />
                              ) : (
                                <UserPlus className="h-4 w-4" />
                              )}
                              <span className="ml-1 hidden sm:inline">
                                {user.role ? "Edit" : "Assign"}
                              </span>
                            </Button>
                            {user.role_id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openDeleteDialog(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          {invitesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitesFiltered?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground">No pending invites</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingInvitesFiltered?.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>{invite.full_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {invite.role === "county_admin"
                              ? "County Admin"
                              : `Church Admin${invite.church_name ? ` - ${invite.church_name}` : ""}`}
                          </Badge>
                        </TableCell>
                        <TableCell>{getInviteStatus(invite)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!invite.accepted_at && (
                              <>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openCancelInviteDialog(invite)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account with email and password. The user will be able to log in immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="user@example.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password *</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name (optional)</Label>
              <Input
                id="create-name"
                type="text"
                placeholder="John Smith"
                value={createFullName}
                onChange={(e) => setCreateFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={createRole}
                onValueChange={(value) => setCreateRole(value as AppRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="county_admin">County Admin</SelectItem>
                  <SelectItem value="church_admin">Church Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createRole === "church_admin" && (
              <div className="space-y-2">
                <Label>Church *</Label>
                <Select value={createChurchId} onValueChange={setCreateChurchId}>
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign/Edit Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.role ? "Edit Role" : "Assign Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">User</p>
              <p className="font-medium">{selectedUser?.email}</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as AppRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="county_admin">County Admin</SelectItem>
                  <SelectItem value="church_admin">Church Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedRole === "church_admin" && (
              <div className="space-y-2">
                <Label>Church</Label>
                <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={assignRoleMutation.isPending}>
              {assignRoleMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Role Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the admin role from {selectedUser?.email}? They
              will no longer have access to the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeRoleMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invite Confirmation */}
      <AlertDialog open={cancelInviteDialogOpen} onOpenChange={setCancelInviteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for {selectedInvite?.email}? They
              will no longer be able to use this invitation link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedInvite && cancelInviteMutation.mutate(selectedInvite.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelInviteMutation.isPending ? "Cancelling..." : "Cancel Invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersManagement;
