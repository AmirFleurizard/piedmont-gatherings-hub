import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Search, UserPlus, Trash2, Edit } from "lucide-react";
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

const UsersManagement = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [selectedChurchId, setSelectedChurchId] = useState<string>("");

  // Fetch all profiles
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, church_id");

      if (rolesError) throw rolesError;

      // Fetch all churches for names
      const { data: churches, error: churchesError } = await supabase
        .from("churches")
        .select("id, name");

      if (churchesError) throw churchesError;

      const churchMap = new Map(churches?.map((c) => [c.id, c.name]) || []);

      // Merge profiles with roles
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
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({
            role: newRole,
            church_id: newRole === "church_admin" ? churchId : null,
          })
          .eq("id", existingRoleId);
        if (error) throw error;
      } else {
        // Insert new role
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
      setDialogOpen(false);
      resetForm();
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
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);
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

  const resetForm = () => {
    setSelectedUser(null);
    setSelectedRole("");
    setSelectedChurchId("");
  };

  const openAssignDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedRole(user.role || "");
    setSelectedChurchId(user.church_id || "");
    setDialogOpen(true);
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

  const filteredUsers = users?.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (role !== "county_admin") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          You don't have permission to manage users.
        </p>
      </div>
    );
  }

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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
                        onClick={() => openAssignDialog(user)}
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

      {/* Assign/Edit Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <label className="text-sm font-medium">Role</label>
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
                <label className="text-sm font-medium">Church</label>
                <Select
                  value={selectedChurchId}
                  onValueChange={setSelectedChurchId}
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignRole}
              disabled={assignRoleMutation.isPending}
            >
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
              Are you sure you want to remove the admin role from{" "}
              {selectedUser?.email}? They will no longer have access to the
              admin dashboard.
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
    </div>
  );
};

export default UsersManagement;
