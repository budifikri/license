import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/Card";
import Button from "./ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/Dialog";
import Input from "./ui/Input";
import Label from "./ui/Label";
import { apiClient } from "@/lib/api/client";
import type { Role, Menu, RolePermission } from "../../types";
import MenuRolePermissionsList from "./MenuRolePermissionsList";
import MenuItemRolePermissionsTable from "./MenuItemRolePermissionsTable";

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "roles" | "menus" | "role-permissions" | "menu-item-permissions"
  >("roles");
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
  const [newMenu, setNewMenu] = useState<
    Omit<Menu, "id" | "createdAt" | "updatedAt">
  >({
    name: "",
    path: "",
    order: 0,
    parentId: null,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load roles and menus in parallel
      const [rolesResponse, menusResponse] = await Promise.all([
        apiClient.get<Role[]>("roles"),
        apiClient.get<Menu[]>("menus"),
      ]);

      if (rolesResponse.error) throw new Error(rolesResponse.error);
      if (menusResponse.error) throw new Error(menusResponse.error);

      setRoles(rolesResponse.data || []);
      setMenus(menusResponse.data || []);
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

  const handleAddMenu = () => {
    setNewMenu({ name: "", path: "", order: 0, parentId: null });
    setCurrentMenu(null);
    setIsMenuModalOpen(true);
  };

  const handleEditMenu = (menu: Menu) => {
    setCurrentMenu(menu);
    setNewMenu({
      name: menu.name,
      path: menu.path,
      order: menu.order,
      parentId: menu.parentId,
    });
    setIsMenuModalOpen(true);
  };

  const handleSubmitMenu = async () => {
    try {
      if (currentMenu) {
        // Update existing menu
        const response = await apiClient.put<Menu>(
          `menus/${currentMenu.id}`,
          newMenu
        );
        if (response.error) throw new Error(response.error);
        setMessage("Menu updated successfully");
      } else {
        // Create new menu
        const response = await apiClient.post<Menu>("menus", newMenu);
        if (response.error) throw new Error(response.error);
        setMessage("Menu created successfully");
      }
      setIsMenuModalOpen(false);
      loadAllData(); // Reload data
    } catch (error) {
      setMessage(
        "Error saving menu: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading role management data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Role Management</h1>
        <p className="text-muted-foreground">
          Manage roles, menus, and their access permissions
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-2">
          <Button
            variant={activeTab === "roles" ? "default" : "ghost"}
            onClick={() => setActiveTab("roles")}
            className="px-4 py-2 text-sm">
            Manage Roles
          </Button>
          <Button
            variant={activeTab === "menus" ? "default" : "ghost"}
            onClick={() => setActiveTab("menus")}
            className="px-4 py-2 text-sm">
            Manage Menus
          </Button>
          <Button
            variant={activeTab === "role-permissions" ? "default" : "ghost"}
            onClick={() => setActiveTab("role-permissions")}
            className="px-4 py-2 text-sm">
            Role Permissions Matrix
          </Button>
          <Button
            variant={
              activeTab === "menu-item-permissions" ? "default" : "ghost"
            }
            onClick={() => setActiveTab("menu-item-permissions")}
            className="px-4 py-2 text-sm">
            Menu Item Permissions
          </Button>
        </nav>
      </div>

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

      {activeTab === "roles" && (
        <Card>
          <CardHeader>
            <CardTitle>Role List</CardTitle>
            <CardDescription>
              Manage available roles in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">ID</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <tr key={role.id} className="border-b">
                        <td className="py-2 font-mono text-sm">{role.id}</td>
                        <td className="py-2">{role.name}</td>
                        <td className="py-2">{role.description}</td>
                        <td className="py-2 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to role permission page
                              window.location.hash = `#role-permissions/${role.id}`;
                            }}>
                            Manage Access
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-4 text-muted-foreground">
                        No roles found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "menus" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Menu Management</CardTitle>
                <CardDescription>Manage application menu items</CardDescription>
              </div>
              <Button onClick={handleAddMenu}>Add Menu</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">ID</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Path</th>
                    <th className="text-left py-2">Order</th>
                    <th className="text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.length > 0 ? (
                    menus.map((menu) => (
                      <tr key={menu.id} className="border-b">
                        <td className="py-2 font-mono text-sm">{menu.id}</td>
                        <td className="py-2">{menu.name}</td>
                        <td className="py-2">{menu.path}</td>
                        <td className="py-2">{menu.order}</td>
                        <td className="py-2 text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMenu(menu)}>
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this menu?"
                                  )
                                ) {
                                  apiClient
                                    .delete(`menus/${menu.id}`)
                                    .then((response) => {
                                      if (response.error)
                                        throw new Error(response.error);
                                      setMessage("Menu deleted successfully");
                                      loadAllData(); // Reload data
                                    })
                                    .catch((error) => {
                                      setMessage(
                                        "Error deleting menu: " +
                                          (error instanceof Error
                                            ? error.message
                                            : "Unknown error")
                                      );
                                    });
                                }
                              }}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-4 text-muted-foreground">
                        No menus found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "role-permissions" && <MenuRolePermissionsList />}
      {activeTab === "menu-item-permissions" && (
        <MenuItemRolePermissionsTable />
      )}

      <Button onClick={loadAllData}>Refresh Data</Button>

      {/* Menu Modal */}
      <Dialog open={isMenuModalOpen} onOpenChange={setIsMenuModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentMenu ? "Edit Menu" : "Add Menu"}</DialogTitle>
            <DialogDescription>
              {currentMenu
                ? "Update the menu details"
                : "Enter details for the new menu"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 px-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newMenu.name}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, name: e.target.value })
                }
                placeholder="Menu name"
              />
            </div>
            <div>
              <Label htmlFor="path">Path</Label>
              <Input
                id="path"
                value={newMenu.path}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, path: e.target.value })
                }
                placeholder="/path"
              />
            </div>
            <div>
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={newMenu.order}
                onChange={(e) =>
                  setNewMenu({
                    ...newMenu,
                    order: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Display order"
              />
            </div>
            <div>
              <Label htmlFor="parentId">Parent ID (optional)</Label>
              <Input
                id="parentId"
                value={newMenu.parentId || ""}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, parentId: e.target.value || null })
                }
                placeholder="Parent menu ID (leave empty for top-level)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMenuModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitMenu}>
              {currentMenu ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
