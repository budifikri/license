import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Updating existing users to use new RBAC system...');

  // Get all roles
  const adminRole = await db.role.findUnique({ where: { name: 'Admin' } });
  const managerRole = await db.role.findUnique({ where: { name: 'Manager' } });
  const userRole = await db.role.findUnique({ where: { name: 'User' } });

  if (!adminRole || !managerRole || !userRole) {
    console.error('Roles not found. Make sure to run the seed script first.');
    return;
  }

  // Update existing users to use the new roleId system based on their old role field
  const users = await db.user.findMany({
    where: {
      role: { not: null } // Only update users that have the old role field set
    }
  });

  console.log(`Found ${users.length} users to update`);

  for (const user of users) {
    let roleId = null;
    
    // Map old role string to new role ID
    if (user.role === 'Admin') {
      roleId = adminRole.id;
    } else if (user.role === 'Manager') {
      roleId = managerRole.id;
    } else if (user.role === 'User') {
      roleId = userRole.id;
    }

    if (roleId) {
      await db.user.update({
        where: { id: user.id },
        data: { roleId }
      });
      console.log(`Updated user ${user.name} (${user.id}) to role ID: ${roleId}`);
    }
  }

  console.log('User role migration completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });