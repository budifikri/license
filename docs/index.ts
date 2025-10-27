// API Documentation Index
// Import all documentation modules

import { userDocs } from './users';
import { productDocs } from './products';
import { planDocs } from './plans';
import { authDocs } from './auth';

// Combine all documentation
export const apiDocumentation = {
  users: userDocs,
  products: productDocs,
  plans: planDocs,
  auth: authDocs,
};

// Export individual modules
export { userDocs };
export { productDocs };
export { planDocs };
export { authDocs };