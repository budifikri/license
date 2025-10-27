import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const db = new PrismaClient();

async function main() {
  console.log('Seeding RBAC data...');

  // Create default roles
  const adminRole = await db.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Administrator with full access'
    }
  });

  const managerRole = await db.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Manager with limited access to certain features'
    }
  });

  const userRole = await db.role.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User',
      description: 'Regular user with limited access'
    }
  });

  console.log('Roles created:', { adminRole, managerRole, userRole });

  // Create default menus
  const dashboardMenu = await db.menu.upsert({
    where: { name: 'Dashboard' },
    update: {},
    create: {
      name: 'Dashboard',
      path: '/dashboard',
      order: 1
    }
  });

  const productsMenu = await db.menu.upsert({
    where: { name: 'Products' },
    update: {},
    create: {
      name: 'Products',
      path: '/products',
      order: 2
    }
  });

  const plansMenu = await db.menu.upsert({
    where: { name: 'Plans' },
    update: {},
    create: {
      name: 'Plans',
      path: '/plans',
      order: 3
    }
  });

  const companiesMenu = await db.menu.upsert({
    where: { name: 'Companies' },
    update: {},
    create: {
      name: 'Companies',
      path: '/companies',
      order: 4
    }
  });

  const usersMenu = await db.menu.upsert({
    where: { name: 'Users' },
    update: {},
    create: {
      name: 'Users',
      path: '/users',
      order: 5
    }
  });

  const licensesMenu = await db.menu.upsert({
    where: { name: 'Licenses' },
    update: {},
    create: {
      name: 'Licenses',
      path: '/licenses',
      order: 6
    }
  });

  const invoicesMenu = await db.menu.upsert({
    where: { name: 'Invoices' },
    update: {},
    create: {
      name: 'Invoices',
      path: '/invoices',
      order: 7
    }
  });

  const devicesMenu = await db.menu.upsert({
    where: { name: 'Devices' },
    update: {},
    create: {
      name: 'Devices',
      path: '/devices',
      order: 8
    }
  });

  const banksMenu = await db.menu.upsert({
    where: { name: 'Banks' },
    update: {},
    create: {
      name: 'Banks',
      path: '/banks',
      order: 9
    }
  });

  const activityMenu = await db.menu.upsert({
    where: { name: 'Activity' },
    update: {},
    create: {
      name: 'Activity',
      path: '/activity',
      order: 10
    }
  });

  const settingsMenu = await db.menu.upsert({
    where: { name: 'Settings' },
    update: {},
    create: {
      name: 'Settings',
      path: '/settings',
      order: 11
    }
  });

  console.log('Menus created');

  // Set permissions for Admin role (full access)
  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: dashboardMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: dashboardMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: productsMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: productsMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: plansMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: plansMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: companiesMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: companiesMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: usersMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: usersMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: licensesMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: licensesMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: invoicesMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: invoicesMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: devicesMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: devicesMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: banksMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: banksMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: activityMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: activityMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: adminRole.id, menuId: settingsMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: settingsMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  console.log('Admin permissions set');

  // Set permissions for Manager role (limited access)
  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: managerRole.id, menuId: dashboardMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: managerRole.id,
      menuId: dashboardMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: managerRole.id, menuId: productsMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: managerRole.id,
      menuId: productsMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: managerRole.id, menuId: plansMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: managerRole.id,
      menuId: plansMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: managerRole.id, menuId: companiesMenu.id } },
    update: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: managerRole.id,
      menuId: companiesMenu.id,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: managerRole.id, menuId: usersMenu.id } },
    update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    create: {
      roleId: managerRole.id,
      menuId: usersMenu.id,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: managerRole.id, menuId: licensesMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: managerRole.id,
      menuId: licensesMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: managerRole.id, menuId: invoicesMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: managerRole.id,
      menuId: invoicesMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: managerRole.id, menuId: devicesMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: managerRole.id,
      menuId: devicesMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: managerRole.id, menuId: banksMenu.id } },
    update: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: managerRole.id,
      menuId: banksMenu.id,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: managerRole.id, menuId: activityMenu.id } },
    update: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: managerRole.id,
      menuId: activityMenu.id,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: managerRole.id, menuId: settingsMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: managerRole.id,
      menuId: settingsMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  console.log('Manager permissions set');

  // Set permissions for User role (very limited access)
  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: userRole.id, menuId: dashboardMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: userRole.id,
      menuId: dashboardMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: userRole.id, menuId: productsMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: userRole.id,
      menuId: productsMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: userRole.id, menuId: plansMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: userRole.id,
      menuId: plansMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: userRole.id, menuId: companiesMenu.id } },
    update: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: userRole.id,
      menuId: companiesMenu.id,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: userRole.id, menuId: usersMenu.id } },
    update: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: userRole.id,
      menuId: usersMenu.id,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: userRole.id, menuId: licensesMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: userRole.id,
      menuId: licensesMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: userRole.id, menuId: invoicesMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: userRole.id,
      menuId: invoicesMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: userRole.id, menuId: devicesMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: userRole.id,
      menuId: devicesMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: userRole.id, menuId: banksMenu.id } },
    update: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: userRole.id,
      menuId: banksMenu.id,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: userRole.id, menuId: activityMenu.id } },
    update: { canView: false, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: userRole.id,
      menuId: activityMenu.id,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  await db.rolePermission.upsert({
    where: { roleId_menuId: { roleId: userRole.id, menuId: settingsMenu.id } },
    update: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    create: {
      roleId: userRole.id,
      menuId: settingsMenu.id,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  });

  console.log('User permissions set');

  console.log('RBAC seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });