import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import Button from './ui/Button';
import { apiClient } from '@/lib/api/client';
import type { Role, Menu, RolePermission } from '../../types';

interface RolePermissionWithMenu extends RolePermission {
  menu: Menu;
}

interface RolePermissionPageProps {
  roleId: string;
}

const RolePermissionPage: React.FC<RolePermissionPageProps> = ({ roleId }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRolePermissions();
  }, [roleId]);

  const loadRolePermissions = async () => {
    setLoading(true);
    try {
      // Load role data
      const roleResponse = await apiClient.get<Role>(`roles/${roleId}`);
      if (roleResponse.error) throw new Error(roleResponse.error);
      setRole(roleResponse.data!);

      // Load all menus
      const menusResponse = await apiClient.get<Menu[]>('menus');
      if (menusResponse.error) throw new Error(menusResponse.error);
      setMenus(menusResponse.data || []);

      // Load role permissions
      const permissionsResponse = await apiClient.get<RolePermission[]>(`role-permissions/role/${roleId}`);
      if (permissionsResponse.error) throw new Error(permissionsResponse.error);
      
      // Create a map of permissions by menuId for easy lookup
      const permissionMap = new Map(permissionsResponse.data?.map(p => [p.menuId, p]));
      
      // Create a complete list of permissions with default values for missing permissions
      const completePermissions = menusResponse.data?.map(menu => {
        const existingPerm = permissionMap.get(menu.id);
        return existingPerm || {
          id: '',
          roleId,
          menuId: menu.id,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }) || [];
      
      setRolePermissions(completePermissions);
    } catch (error) {
      console.error('Error loading role permissions:', error);
      setMessage('Error loading role permissions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (menuId: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete', value: boolean) => {
    try {
      // Check if a permission record already exists for this role-menu combination
      const existingPermission = rolePermissions.find(p => p.menuId === menuId);
      
      if (existingPermission && existingPermission.id) {
        // Update existing permission
        const response = await apiClient.put<RolePermission>(`role-permissions/${existingPermission.id}`, {
          [action]: value
        });
        
        if (response.error) throw new Error(response.error);

        // Update local state
        setRolePermissions(prev => 
          prev.map(perm => 
            perm.menuId === menuId ? { ...perm, [action]: value } : perm
          )
        );
      } else {
        // Create new permission
        const response = await apiClient.post<RolePermission>('role-permissions', {
          roleId,
          menuId,
          [action]: value
        });
        
        if (response.error) throw new Error(response.error);

        // Update local state
        setRolePermissions(prev => 
          prev.map(perm => 
            perm.menuId === menuId ? { ...response.data!, [action]: value } : perm
          )
        );
      }
      
      setMessage('Permission updated successfully');
    } catch (error) {
      console.error('Error updating permission:', error);
      setMessage('Error updating permission: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleBulkSave = async () => {
    try {
      // Prepare the bulk update data
      const permissions = rolePermissions.map(perm => ({
        menuId: perm.menuId,
        canView: perm.canView,
        canCreate: perm.canCreate,
        canEdit: perm.canEdit,
        canDelete: perm.canDelete
      }));

      // Call the bulk update endpoint
      const response = await apiClient.post<{message: string; updatedPermissions: RolePermission[]}>('role-permissions/bulk', {
        roleId,
        permissions
      });

      if (response.error) throw new Error(response.error);

      setMessage(`Updated ${response.data?.updatedPermissions.length} permissions successfully`);
    } catch (error) {
      console.error('Error updating permissions:', error);
      setMessage('Error updating permissions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading role permissions...</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Role not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Access for {role.name}</h1>
          <p className="text-muted-foreground">{role.description}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            // Go back to role management page
            window.location.hash = '#roles';
          }}
        >
          Back to Roles
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Menu Permissions</CardTitle>
          <CardDescription>Manage what this role can do with each menu item</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Menu Name</th>
                  <th className="text-center py-2">Path</th>
                  <th className="text-center py-2">
                    <div className="flex flex-col items-center">
                      <span>View</span>
                      <span className="text-xs text-muted-foreground">(Read)</span>
                    </div>
                  </th>
                  <th className="text-center py-2">
                    <div className="flex flex-col items-center">
                      <span>Create</span>
                      <span className="text-xs text-muted-foreground">(Add)</span>
                    </div>
                  </th>
                  <th className="text-center py-2">
                    <div className="flex flex-col items-center">
                      <span>Edit</span>
                      <span className="text-xs text-muted-foreground">(Update)</span>
                    </div>
                  </th>
                  <th className="text-center py-2">
                    <div className="flex flex-col items-center">
                      <span>Delete</span>
                      <span className="text-xs text-muted-foreground">(Remove)</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rolePermissions.length > 0 ? (
                  rolePermissions.map(permission => {
                    const menu = menus.find(m => m.id === permission.menuId);
                    return (
                      <tr key={permission.menuId} className="border-b">
                        <td className="py-2 font-medium">{menu?.name || permission.menuId}</td>
                        <td className="py-2 text-sm text-muted-foreground">{menu?.path}</td>
                        <td className="py-2 text-center">
                          <input
                            type="checkbox"
                            checked={permission.canView}
                            onChange={(e) => handlePermissionChange(permission.menuId, 'canView', e.target.checked)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="checkbox"
                            checked={permission.canCreate}
                            onChange={(e) => handlePermissionChange(permission.menuId, 'canCreate', e.target.checked)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="checkbox"
                            checked={permission.canEdit}
                            onChange={(e) => handlePermissionChange(permission.menuId, 'canEdit', e.target.checked)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="checkbox"
                            checked={permission.canDelete}
                            onChange={(e) => handlePermissionChange(permission.menuId, 'canDelete', e.target.checked)}
                            className="h-4 w-4"
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted-foreground">
                      No menu permissions found for this role
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={() => {
            // Go back to role management page
            window.location.hash = '#roles';
          }}
        >
          Cancel
        </Button>
        <Button onClick={handleBulkSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default RolePermissionPage;