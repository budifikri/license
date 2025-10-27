import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting the database connection limit by creating a new instance with every request.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const client = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  if (!global.prisma) {
    global.prisma = client;
  }
}

export default client;