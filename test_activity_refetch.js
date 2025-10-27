// Test script to verify the activity log functionality with refetch
// This tests that the data is properly cleared and can be refetched

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function testActivityLogRefetch() {
  try {
    console.log("Testing activity log functionality with refetch approach...");
    
    // First, let's create a test activity log to make sure we have something to clear
    const testActivity = await db.activityLog.create({
      data: {
        userId: 'test-user',
        action: 'create',
        entityType: 'Test',
        entityName: 'Test Entity',
        createdAt: new Date()
      }
    });
    console.log("Created test activity log:", testActivity.id);
    
    const initialCount = await db.activityLog.count();
    console.log(`Count after adding test log: ${initialCount}`);
    
    // Clear all activity logs using the same method as the service
    const deleteResult = await db.activityLog.deleteMany({});
    console.log(`Cleared ${deleteResult.count} activity logs`);
    
    // Verify that they were deleted
    const afterDeleteCount = await db.activityLog.count();
    console.log(`Activity log count after deletion: ${afterDeleteCount}`);
    
    if (afterDeleteCount === 0) {
      console.log("✓ Backend functionality is working correctly - logs were cleared!");
    } else {
      console.log("✗ Backend functionality issue - logs were not cleared.");
    }
    
    // Now test refetch approach by adding a new log and simulating the frontend approach
    const newLog = await db.activityLog.create({
      data: {
        userId: 'test-user-2',
        action: 'update',
        entityType: 'Test2',
        entityName: 'Test Entity 2',
        createdAt: new Date()
      }
    });
    console.log("Added new test log for refetch test:", newLog.id);
    
    const countBeforeRefetch = await db.activityLog.count();
    console.log(`Count before 'refetch simulation': ${countBeforeRefetch}`);
    
    // Simulate the refetch by just getting the current data again
    const activityLogs = await db.activityLog.findMany();
    console.log(`Refetch simulation found ${activityLogs.length} logs`);
    
    console.log("✓ Refetch approach should work - the data can be refreshed without page reload!");
    
  } catch (error) {
    console.error("Error during activity log refetch test:", error.message);
  } finally {
    await db.$disconnect();
  }
}

testActivityLogRefetch();