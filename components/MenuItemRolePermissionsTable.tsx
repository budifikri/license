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
import type { Role, Menu, RolePermission } from "../types";

interface MenuItemWithPermissions {
  menu: Menu;
  permissions: Record<string, RolePermission>; // keyed by roleId
}

const MenuItemRolePermissionsTable: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
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
          apiClient.get<RolePermission[]>("role-permissions"),
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

  // Organize data for display
  const menuItemsWithPermissions = React.useMemo(() => {
    const result: MenuItemWithPermissions[] = [];

    menus.forEach((menu) => {
      const permissionsMap: Record<string, RolePermission> = {};

      // Initialize with default permissions for all roles
      roles.forEach((role) => {
        permissionsMap[role.id] = {
          id: "",
          roleId: role.id,
          menuId: menu.id,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      // Override with actual permissions
      rolePermissions
        .filter((perm) => perm.menuId === menu.id)
        .forEach((perm) => {
          permissionsMap[perm.roleId] = perm;
        });

      result.push({
        menu,
        permissions: permissionsMap,
      });
    });

    return result;
  }, [menus, roles, rolePermissions]);

  const handlePermissionToggle = async (
    menuId: string,
    roleId: string,
    field: keyof RolePermission
  ) => {
    try {
      const existingPermission = rolePermissions.find(
        (p) => p.menuId === menuId && p.roleId === roleId
      );

      let updatedPermission;

      if (existingPermission && existingPermission.id) {
        // Update existing permission
        const newValue = !(existingPermission[field] as boolean);
        const response = await apiClient.put<RolePermission>(
          `role-permissions/${existingPermission.id}`,
          { [field]: newValue }
        );

        if (response.error) throw new Error(response.error);
        updatedPermission = response.data!;
      } else {
        // Create new permission
        const defaultValue = field === "canView" ? true : false;
        const response = await apiClient.post<RolePermission>(
          "role-permissions",
          {
            roleId,
            menuId,
            [field]: defaultValue,
          }
        );

        if (response.error) throw new Error(response.error);
        updatedPermission = response.data!;
      }

      // Update local state
      setRolePermissions((prev) => {
        const newPermissions = [...prev];
        const index = newPermissions.findIndex(
          (p) => p.menuId === menuId && p.roleId === roleId
        );

        if (index >= 0) {
          newPermissions[index] = updatedPermission;
        } else {
          newPermissions.push(updatedPermission);
        }

        return newPermissions;
      });

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
        <p>Loading menu item role permissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* <div>
        <h1 className="text-3xl font-bold">Menu Item Role Permissions</h1>
        <p className="text-muted-foreground">View and manage permissions for each menu item by role</p>
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
              <CardTitle>Menu Permissions by Role</CardTitle>
              <CardDescription>
                Detailed view of permissions for each menu item across all roles
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {/* <Button
                variant="outline"
                onClick={() => {
                  // Navigate to role permissions matrix
                  window.location.hash = "#menu-permissions";
                }}>
                Role Permissions Matrix
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Navigate back to main RBAC page
                  window.location.hash = "#";
                }}>
                Back to RBAC
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
                    Menu Item
                  </th>
                  <th className="border p-2 bg-gray-100 text-left">Path</th>
                  {roles.map((role) => (
                    <th
                      key={role.id}
                      className="border p-2 bg-gray-100 text-center"
                      colSpan={4}>
                      <div className="font-semibold">{role.name}</div>
                      {role.description && (
                        <div className="text-xs text-muted-foreground">
                          {role.description}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="border p-2 bg-gray-50"></th>
                  <th className="border p-2 bg-gray-50"></th>
                  {roles.map((role) => (
                    <React.Fragment key={role.id}>
                      <th className="border p-1 bg-gray-50 text-center text-xs">
                        View
                      </th>
                      <th className="border p-1 bg-gray-50 text-center text-xs">
                        Create
                      </th>
                      <th className="border p-1 bg-gray-50 text-center text-xs">
                        Edit
                      </th>
                      <th className="border p-1 bg-gray-50 text-center text-xs">
                        Delete
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {menuItemsWithPermissions.map(({ menu, permissions }) => (
                  <tr key={menu.id}>
                    <td className="border p-2 font-medium">{menu.name}</td>
                    <td className="border p-2 text-sm text-muted-foreground">
                      {menu.path}
                    </td>
                    {roles.map((role) => {
                      const permission = permissions[role.id];
                      return (
                        <React.Fragment key={role.id}>
                          <td className="border p-1 text-center">
                            <input
                              type="checkbox"
                              checked={permission.canView}
                              onChange={() =>
                                handlePermissionToggle(
                                  menu.id,
                                  role.id,
                                  "canView"
                                )
                              }
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="border p-1 text-center">
                            <input
                              type="checkbox"
                              checked={permission.canCreate}
                              onChange={() =>
                                handlePermissionToggle(
                                  menu.id,
                                  role.id,
                                  "canCreate"
                                )
                              }
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="border p-1 text-center">
                            <input
                              type="checkbox"
                              checked={permission.canEdit}
                              onChange={() =>
                                handlePermissionToggle(
                                  menu.id,
                                  role.id,
                                  "canEdit"
                                )
                              }
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="border p-1 text-center">
                            <input
                              type="checkbox"
                              checked={permission.canDelete}
                              onChange={() =>
                                handlePermissionToggle(
                                  menu.id,
                                  role.id,
                                  "canDelete"
                                )
                              }
                              className="h-4 w-4"
                            />
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {menuItemsWithPermissions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No menu items found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuItemRolePermissionsTable;
