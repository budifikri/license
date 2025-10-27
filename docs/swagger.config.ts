// Swagger Configuration
// This file configures the Swagger documentation options

import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'License Management Dashboard API',
      version: '1.0.0',
      description: 'API for managing software licenses, products, plans, invoices, and more',
    },
    servers: [
      {
        url: `http://${process.env.BACKEND_HOST || 'localhost'}:${process.env.PORT || '5000'}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Products',
        description: 'Operations related to products'
      },
      {
        name: 'Plans',
        description: 'Operations related to plans'
      },
      {
        name: 'Companies',
        description: 'Operations related to companies'
      },
      {
        name: 'Users',
        description: 'Operations related to users'
      },
      {
        name: 'Licenses',
        description: 'Operations related to licenses'
      },
      {
        name: 'Devices',
        description: 'Operations related to devices'
      },
      {
        name: 'Invoices',
        description: 'Operations related to invoices'
      },
      {
        name: 'Banks',
        description: 'Operations related to banks'
      },
      {
        name: 'Activity Logs',
        description: 'Operations related to activity logs'
      },
      {
        name: 'Auth',
        description: 'Authentication operations'
      }
    ]
  },
  apis: ['./docs/*.js', './docs/*.ts', './server/server.ts'], // Path to the API docs
};