import { Request, Response } from 'express';

// Authentication API documentation definitions
export const authDocs = {
  // Login
  login: {
    post: {
      summary: 'Log in a user',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'admin@gmail.com' },
                password: { type: 'string', example: 'admin123' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      role: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        '400': { description: 'Bad request' },
        '401': { description: 'Invalid credentials' }
      }
    }
  },

  // Register
  register: {
    post: {
      summary: 'Register a new user',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'password'],
              properties: {
                name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', format: 'email', example: 'johndoe@example.com' },
                password: { type: 'string', example: 'securepassword123' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'User registered successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      role: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        '400': { description: 'Bad request' },
        '409': { description: 'User with this email already exists' }
      }
    }
  },

  // Get current user profile
  getMe: {
    get: {
      summary: 'Get current user profile',
      tags: ['Auth'],
      security: [
        {
          bearerAuth: []
        }
      ],
      responses: {
        '200': {
          description: 'User profile retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  },

  // Change password
  changePassword: {
    post: {
      summary: 'Change user password',
      tags: ['Auth'],
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
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: { type: 'string', example: 'oldpassword123' },
                newPassword: { type: 'string', example: 'newpassword123' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Password changed successfully' },
        '400': { description: 'Current password or new password not provided' },
        '401': { description: 'Unauthorized or current password incorrect' },
        '500': { description: 'Internal server error' }
      }
    }
  },

  // Refresh token
  refresh: {
    post: {
      summary: 'Refresh access token',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                refreshToken: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Token refreshed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' }
                }
              }
            }
          }
        },
        '400': { description: 'Bad request' },
        '401': { description: 'Invalid refresh token' }
      }
    }
  },

  // Logout
  logout: {
    post: {
      summary: 'Log out a user',
      tags: ['Auth'],
      security: [
        {
          bearerAuth: []
        }
      ],
      responses: {
        '200': { description: 'Logout successful' },
        '401': { description: 'Unauthorized' }
      }
    }
  }
};