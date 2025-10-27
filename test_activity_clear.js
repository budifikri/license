// Test script to verify the activity log clear functionality
// This directly tests the database operation part that should work after the fix

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function testActivityLogClear() {
  try {
    console.log("Testing activity log clear functionality...");
    
    // First, let's check how many activity logs exist
    const initialCount = await db.activityLog.count();
    console.log(`Initial activity log count: ${initialCount}`);
    
    // If there are some activity logs, try to clear them using the same logic as the service
    if (initialCount > 0) {
      console.log("Attempting to clear all activity logs using the same method as the service...");
      
      // This replicates what activityLogService.deleteAll() does
      const deleteResult = await db.activityLog.deleteMany({});
      console.log(`Successfully deleted ${deleteResult.count} activity logs`);
      
      // Verify that they were deleted
      const afterDeleteCount = await db.activityLog.count();
      console.log(`Activity log count after deletion: ${afterDeleteCount}`);
      
      if (afterDeleteCount === 0) {
        console.log("✓ Activity log clear functionality is working correctly!");
      } else {
        console.log("✗ Activity log clear functionality is not working as expected.");
      }
    } else {
      console.log("No activity logs to clear, but the endpoint should still work when activity logs are present.");
    }
    
  } catch (error) {
    console.error("Error during activity log clear test:", error.message);
  } finally {
    await db.$disconnect();
  }
}

testActivityLogClear();