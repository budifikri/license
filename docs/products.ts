import { Request, Response } from 'express';

// Product API documentation definitions
export const productDocs = {
  // Get all products
  getAllProducts: {
    get: {
      summary: 'Get all products',
      tags: ['Products'],
      security: [
        {
          bearerAuth: []
        }
      ],
      responses: {
        '200': {
          description: 'A list of products',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  },

  // Get product by ID
  getProductById: {
    get: {
      summary: 'Get a product by ID',
      tags: ['Products'],
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
          description: 'The product ID'
        }
      ],
      responses: {
        '200': {
          description: 'A single product',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Product not found' }
      }
    }
  },

  // Create product
  createProduct: {
    post: {
      summary: 'Create a new product',
      tags: ['Products'],
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
              required: ['name', 'description'],
              properties: {
                name: { type: 'string', example: 'Software Product' },
                description: { type: 'string', example: 'Description of the software product' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Created product',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  },

  // Update product
  updateProduct: {
    put: {
      summary: 'Update a product',
      tags: ['Products'],
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
          description: 'The product ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Updated Software Product' },
                description: { type: 'string', example: 'Updated description' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Updated product',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Product not found' }
      }
    }
  },

  // Delete product
  deleteProduct: {
    delete: {
      summary: 'Delete a product',
      tags: ['Products'],
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
          description: 'The product ID'
        }
      ],
      responses: {
        '204': {
          description: 'Product deleted successfully'
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Product not found' }
      }
    }
  }
};