import { Request, Response } from 'express';

// User API documentation definitions
export const userDocs = {
  // Get all users
  getAllUsers: {
    get: {
      summary: 'Get all users',
      description: 'Retrieve a list of all users with optional email filtering',
      tags: ['Users'],
      security: [
        {
          bearerAuth: []
        }
      ],
      responses: {
        '200': {
          description: 'A list of users',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                    companyId: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized'
        }
      }
    }
  },

  // Get user by ID
  getUserById: {
    get: {
      summary: 'Get a user by ID',
      tags: ['Users'],
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
          description: 'The user ID'
        }
      ],
      responses: {
        '200': {
          description: 'A single user',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  companyId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'User not found' }
      }
    }
  },

  // Get user by email (public)
  getUserByEmail: {
    get: {
      summary: 'Get a user by email',
      tags: ['Users'],
      parameters: [
        {
          in: 'path',
          name: 'email',
          required: true,
          schema: { type: 'string' },
          description: 'The user email'
        }
      ],
      responses: {
        '200': {
          description: 'A single user',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  companyId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        '404': { description: 'User not found' }
      }
    }
  },

  // Create user
  createUser: {
    post: {
      summary: 'Create a new user',
      tags: ['Users'],
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
              required: ['name', 'email', 'companyId'],
              properties: {
                name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                role: { type: 'string', example: 'User' },
                companyId: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Created user',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  companyId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '409': { description: 'Email already exists' }
      }
    }
  },

  // Update user
  updateUser: {
    put: {
      summary: 'Update a user',
      tags: ['Users'],
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
          description: 'The user ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                role: { type: 'string', example: 'User' },
                companyId: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Updated user',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  companyId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'User not found' }
      }
    }
  },

  // Delete user
  deleteUser: {
    delete: {
      summary: 'Delete a user',
      tags: ['Users'],
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
          description: 'The user ID'
        }
      ],
      responses: {
        '204': {
          description: 'User deleted successfully'
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'User not found' }
      }
    }
  }
};