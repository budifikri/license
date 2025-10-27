import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/Card";
import Button from "./ui/Button";
import { apiClient } from "@/lib/api/client";
import type { Role, Menu, RolePermission } from "../../types";

interface ExtendedRolePermission extends RolePermission {
  role: Role;
  menu: Menu;
}

const MenuRolePermissionsList: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [rolePermissions, setRolePermissions] = useState<
    ExtendedRolePermission[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [rolesResponse, menusResponse, permissionsResponse] =
        await Promise.all([
          apiClient.get<Role[]>("roles"),
          apiClient.get<Menu[]>("menus"),
          apiClient.get<ExtendedRolePermission[]>("role-permissions"),
        ]);

      if (rolesResponse.error) throw new Error(rolesResponse.error);
      if (menusResponse.error) throw new Error(menusResponse.error);
      if (permissionsResponse.error) throw new Error(permissionsResponse.error);

      setRoles(rolesResponse.data || []);
      setMenus(menusResponse.data || []);
      setRolePermissions(permissionsResponse.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setMessage(
        "Error loading data: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (
    permissionId: string,
    roleId: string,
    menuId: string,
    field: "canView" | "canCreate" | "canEdit" | "canDelete",
    value: boolean
  ) => {
    try {
      let updatedPermission;

      if (permissionId) {
        // Update existing permission
        const response = await apiClient.put<ExtendedRolePermission>(
          `role-permissions/${permissionId}`,
          {
            [field]: value,
          }
        );

        if (response.error) throw new Error(response.error);
        updatedPermission = response.data!;
      } else {
        // Create new permission
        const response = await apiClient.post<ExtendedRolePermission>(
          "role-permissions",
          {
            roleId,
            menuId,
            [field]: value,
          }
        );

        if (response.error) throw new Error(response.error);
        updatedPermission = response.data!;
      }

      // Update local state
      setRolePermissions((prev) =>
        prev.map((perm) =>
          perm.roleId === roleId && perm.menuId === menuId
            ? { ...perm, ...updatedPermission }
            : perm
        )
      );

      setMessage("Permission updated successfully");
    } catch (error) {
      console.error("Error updating permission:", error);
      setMessage(
        "Error updating permission: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading menu role permissions...</p>
      </div>
    );
  }

  // Create a matrix of roles vs menus for easier display
  const permissionMatrix: Record<
    string,
    Record<string, ExtendedRolePermission>
  > = {};

  // Initialize the matrix
  roles.forEach((role) => {
    permissionMatrix[role.id] = {};
    menus.forEach((menu) => {
      // Find existing permission or create a default one
      const existingPerm = rolePermissions.find(
        (p) => p.roleId === role.id && p.menuId === menu.id
      );
      permissionMatrix[role.id][menu.id] = existingPerm || {
        id: "",
        roleId: role.id,
        menuId: menu.id,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        role: role,
        menu: menu,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  });

  return (
    <div className="space-y-6">
      {/* <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Menu Role Permissions</h1>
          <p className="text-muted-foreground">Manage access permissions for each role and menu combination</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => {
            // Navigate back to roles page
            window.location.hash = '#';
          }}
        >
          Back to Roles
        </Button>
      </div> */}

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.includes("Error")
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}>
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Role Permissions Matrix</CardTitle>
              <CardDescription>
                View and edit permissions for each role and menu combination
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {/* <Button
                variant="outline"
                onClick={() => {
                  // Navigate to menu item permissions table
                  window.location.hash = "#menu-item-permissions";
                }}>
                View Menu Item Permissions
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Navigate back to roles page
                  window.location.hash = "#";
                }}>
                Back to Roles
              </Button> */}
              <Button onClick={loadData}>Refresh Data</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-100 text-left">
                    Menu / Role
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role.id}
                      className="border p-2 bg-gray-100 text-center">
                      <div className="font-semibold">{role.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {role.description || ""}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <tr key={menu.id}>
                    <td className="border p-2 font-medium">
                      <div>{menu.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {menu.path}
                      </div>
                    </td>
                    {roles.map((role) => {
                      const permission = permissionMatrix[role.id][menu.id];
                      return (
                        <td
                          key={`${role.id}-${menu.id}`}
                          className="border p-2 text-center">
                          <div className="flex flex-col space-y-1">
                            <div className="flex justify-center space-x-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={permission.canView}
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      permission.id,
                                      permission.roleId,
                                      permission.menuId,
                                      "canView",
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="ml-1 text-xs">View</span>
                              </label>
                            </div>
                            <div className="flex justify-center space-x-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={permission.canCreate}
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      permission.id,
                                      permission.roleId,
                                      permission.menuId,
                                      "canCreate",
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="ml-1 text-xs">Create</span>
                              </label>
                            </div>
                            <div className="flex justify-center space-x-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={permission.canEdit}
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      permission.id,
                                      permission.roleId,
                                      permission.menuId,
                                      "canEdit",
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="ml-1 text-xs">Edit</span>
                              </label>
                            </div>
                            <div className="flex justify-center space-x-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={permission.canDelete}
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      permission.id,
                                      permission.roleId,
                                      permission.menuId,
                                      "canDelete",
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="ml-1 text-xs">Delete</span>
                              </label>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuRolePermissionsList;
