import { Request, Response } from 'express';

// Plan API documentation definitions
export const planDocs = {
  // Get all plans
  getAllPlans: {
    get: {
      summary: 'Get all plans',
      tags: ['Plans'],
      parameters: [
        {
          in: 'query',
          name: 'productId',
          schema: { type: 'string' },
          required: false,
          description: 'Filter plans by product ID'
        }
      ],
      responses: {
        '200': {
          description: 'A list of plans',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    productId: { type: 'string' },
                    name: { type: 'string' },
                    price: { type: 'number' },
                    deviceLimit: { type: 'number' },
                    durationDays: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  // Get plan by ID
  getPlanById: {
    get: {
      summary: 'Get a plan by ID',
      tags: ['Plans'],
      security: [
        {
          bearerAuth: []
        }
      ],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'The plan ID'
        }
      ],
      responses: {
        '200': {
          description: 'A single plan',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  productId: { type: 'string' },
                  name: { type: 'string' },
                  price: { type: 'number' },
                  deviceLimit: { type: 'number' },
                  durationDays: { type: 'number' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Plan not found' }
      }
    }
  },

  // Create plan
  createPlan: {
    post: {
      summary: 'Create a new plan',
      tags: ['Plans'],
      security: [
        {
          bearerAuth: []
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['productId', 'name', 'price', 'deviceLimit', 'durationDays'],
              properties: {
                productId: { type: 'string' },
                name: { type: 'string', example: 'Basic Plan' },
                price: { type: 'number', example: 2999 },
                deviceLimit: { type: 'number', example: 1 },
                durationDays: { type: 'number', example: 30 }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Created plan',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  productId: { type: 'string' },
                  name: { type: 'string' },
                  price: { type: 'number' },
                  deviceLimit: { type: 'number' },
                  durationDays: { type: 'number' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  },

  // Update plan
  updatePlan: {
    put: {
      summary: 'Update a plan',
      tags: ['Plans'],
      security: [
        {
          bearerAuth: []
        }
      ],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'The plan ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Updated Plan Name' },
                price: { type: 'number', example: 3999 },
                deviceLimit: { type: 'number', example: 2 },
                durationDays: { type: 'number', example: 60 }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Updated plan',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  productId: { type: 'string' },
                  name: { type: 'string' },
                  price: { type: 'number' },
                  deviceLimit: { type: 'number' },
                  durationDays: { type: 'number' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Plan not found' }
      }
    }
  },

  // Delete plan
  deletePlan: {
    delete: {
      summary: 'Delete a plan',
      tags: ['Plans'],
      security: [
        {
          bearerAuth: []
        }
      ],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'The plan ID'
        }
      ],
      responses: {
        '204': {
          description: 'Plan deleted successfully'
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Plan not found' }
      }
    }
  }
};