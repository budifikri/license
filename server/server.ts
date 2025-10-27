import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { openApiSpec } from "../docs/openapi.loader.js";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import {
  productService,
  planService,
  companyService,
  userService,
  licenseService,
  deviceService,
  invoiceService,
  activityLogService,
  bankService,
  roleService,
  menuService,
  rolePermissionService,
} from "./services.js";
import * as jwtUtils from "../lib/auth/jwt.js";
import jwt from "jsonwebtoken";
import { getFullDeviceInfo } from "../utils/device-info.js";

const db = new PrismaClient();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "License Management Dashboard API",
      version: "1.0.0",
      description:
        "API for managing software licenses, products, plans, invoices, and more",
    },
    servers: [
      {
        url: `http://${process.env.BACKEND_HOST || "localhost"}:${
          process.env.PORT || "3000"
        }`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Products",
        description: "Operations related to products",
      },
      {
        name: "Plans",
        description: "Operations related to plans",
      },
      {
        name: "Companies",
        description: "Operations related to companies",
      },
      {
        name: "Users",
        description: "Operations related to users",
      },
      {
        name: "Licenses",
        description: "Operations related to licenses",
      },
      {
        name: "Devices",
        description: "Operations related to devices",
      },
      {
        name: "Invoices",
        description: "Operations related to invoices",
      },
      {
        name: "Banks",
        description: "Operations related to banks",
      },
      {
        name: "Activity Logs",
        description: "Operations related to activity logs",
      },
      {
        name: "Auth",
        description: "Authentication operations",
      },
    ],
  },
  apis: ["./openapi/*.yaml"], // Path to the API docs
};

const specs = swaggerJsdoc(options);

const app = express();
const PORT = parseInt(process.env.PORT || "5000");
const BACKEND_HOST = process.env.BACKEND_HOST || "localhost";

// JWT Authentication Middleware
import { authenticateJWT } from "../lib/auth/jwt.js";

// Public endpoints that don't require authentication
const publicEndpoints = [
  "/api-docs",
  "/api-docs/",
  "/health",
  "/", // Root path should only match exact root, not all paths
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/devices/heartbeat", // Device heartbeat endpoint - public for license validation
  "/api/device-info", // Device info endpoint - public
  "/api/plans", // Get all plans - public with optional productId filter
  "/api/companies", // Create a new company - public
  "/api/users", // Create a new user - public
  "/api/invoices", // Create a new invoice - public
  "/api/licenses", // Create a new license - public
  "/api/banks", // Get all banks - public
  "/api/users/by-email/", // Get user by email - public endpoint
];

// Additional endpoint patterns that should be public (using a function)
const isPublicEndpoint = (path: string): boolean => {
  // Check if path is for static assets (CSS, JS, images, etc.)
  if (
    path.startsWith("/assets/") ||
    path.endsWith(".css") ||
    path.endsWith(".js") ||
    path.endsWith(".png") ||
    path.endsWith(".jpg") ||
    path.endsWith(".jpeg") ||
    path.endsWith(".gif") ||
    path.endsWith(".svg") ||
    path.endsWith(".ico") ||
    path.startsWith("/api-docs/swagger") // Swagger static assets
  ) {
    return true;
  }

  // Check if path matches specific patterns for public API endpoints
  if (path.startsWith("/api/plans/") && path.match(/^\/api\/plans\/[^\/]+$/)) {
    // This matches /api/plans/{id} but not /api/plans (which returns all plans)
    return true;
  }

  if (
    path.startsWith("/api/products/") &&
    path.match(/^\/api\/products\/[^\/]+$/)
  ) {
    // This matches /api/products/{id} but not /api/products (which returns all products)
    return true;
  }

  if (
    path.startsWith("/api/companies/") &&
    path.match(/^\/api\/companies\/[^\/]+$/)
  ) {
    // This matches /api/companies/{id} but not /api/companies (which might return all companies)
    return true;
  }

  const isPublic = publicEndpoints.some((endpoint) => {
    // Special handling for root path to match exactly, not as a prefix
    if (endpoint === "/") {
      return path === "/";
    }
    return path.startsWith(endpoint);
  });
  return isPublic;
};

// Middleware
app.use(cors());
app.use(express.json());

// Apply JWT authentication middleware to all routes except public endpoints
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip JWT auth for static assets and public endpoints
  if (isPublicEndpoint(req.path)) {
    return next();
  }

  // Apply JWT authentication for all other endpoints
  authenticateJWT(req, res, next);
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Get user with password for authentication
    const user = await userService.getByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify the provided password against the stored hashed password
    if (!user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare the provided password with the hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = jwtUtils.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role || 'User', // Default to 'User' if role is null
    });

    // Generate refresh token
    const refreshTokenSecret: string = process.env.REFRESH_TOKEN_SECRET ||
      "fallback-refresh-secret-change-in-production";
    const refreshToken = (jwt.sign as any)(
      { userId: user.id, email: user.email },
      refreshTokenSecret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
    );

    // Store refresh token in user (in a real app, store in DB or cache)
    // For demo, we'll just send it to the client

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'User', // Default to 'User' if role is null
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const refreshTokenSecret =
      process.env.REFRESH_TOKEN_SECRET ||
      "fallback-refresh-secret-change-in-production";

    try {
      const decoded = jwt.verify(refreshToken, refreshTokenSecret) as {
        userId: string;
        email: string;
      };

      // Get user to verify they still exist
      const user = await userService.getById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      // Generate new access token
      const accessToken = jwtUtils.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role || 'User', // Default to 'User' if role is null
      });

      res.json({ accessToken });
    } catch (error) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  try {
    // In a real app, you would invalidate the refresh token
    // For demo, we'll just return success

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    // Check if user already exists
    try {
      const existingUser = await userService.getByEmail(email);
      if (existingUser) {
        return res
          .status(409)
          .json({ error: "User with this email already exists" });
      }
    } catch (error) {
      // User doesn't exist, continue with registration
    }

    // Get the first company to assign the user to (as a default)
    const companies = await companyService.getAll();
    if (companies.length === 0) {
      return res.status(400).json({
        error: "Cannot register a new user: No companies exist in the system.",
      });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user with hashed password
    const newUser = await userService.create({
      name,
      email,
      password: hashedPassword, // Store the hashed password
      role: "User", // Default role for new users
      companyId: companies[0].id, // Assign to first company
    });

    // Generate tokens for the newly registered user
    const accessToken = jwtUtils.generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role || 'User', // Default to 'User' if role is null
    });

    const refreshTokenSecret: string = process.env.REFRESH_TOKEN_SECRET ||
      "fallback-refresh-secret-change-in-production";
    const refreshToken = (jwt.sign as any)(
      { userId: newUser.id, email: newUser.email },
      refreshTokenSecret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
    );

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role || 'User', // Default to 'User' if role is null
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.get("/api/auth/me", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get full user info from database
    const fullUser = await userService.getById(user.userId);
    if (!fullUser) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      id: fullUser.id,
      name: fullUser.name,
      email: fullUser.email,
      role: fullUser.role || 'User', // Default to 'User' if role is null
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ error: "Failed to retrieve user profile" });
  }
});

app.post("/api/auth/change-password", async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const authenticatedUser = (req as any).user;

    if (!authenticatedUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    // Get user with password for verification
    const user = await userService.getByEmail(authenticatedUser.email);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidCurrentPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Error handling middleware

app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const products = await productService.getAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const product = await productService.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.post("/api/products", async (req: Request, res: Response) => {
  try {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.put("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const product = await productService.update(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:id", async (req: Request, res: Response) => {
  try {
    await productService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

app.get("/api/plans", async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;

    let plans;
    if (productId) {
      // Filter plans by productId if provided
      plans = await planService.getByProductId(productId as string);
    } else {
      // Get all plans if no filter is provided
      plans = await planService.getAll();
    }

    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

app.get("/api/plans/:id", async (req: Request, res: Response) => {
  try {
    const plan = await planService.getById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch plan" });
  }
});

app.post("/api/plans", async (req: Request, res: Response) => {
  try {
    const plan = await planService.create(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: "Failed to create plan" });
  }
});

app.put("/api/plans/:id", async (req: Request, res: Response) => {
  try {
    const plan = await planService.update(req.params.id, req.body);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: "Failed to update plan" });
  }
});

app.delete("/api/plans/:id", async (req: Request, res: Response) => {
  try {
    await planService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete plan" });
  }
});

app.get("/api/companies", async (req: Request, res: Response) => {
  try {
    const companies = await companyService.getAll();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

app.get("/api/companies/:id", async (req: Request, res: Response) => {
  try {
    const company = await companyService.getById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch company" });
  }
});

app.post("/api/companies", async (req: Request, res: Response) => {
  try {
    const { name, address, phone, email, website } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    const company = await companyService.create({
      name,
      address,
      phone,
      email,
      website
    });
    res.status(201).json(company);
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ error: "Failed to create company", details: (error as Error).message });
  }
});

app.put("/api/companies/:id", async (req: Request, res: Response) => {
  try {
    const company = await companyService.update(req.params.id, req.body);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: "Failed to update company" });
  }
});

app.delete("/api/companies/:id", async (req: Request, res: Response) => {
  try {
    await companyService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete company" });
  }
});

app.get("/api/users", async (req: Request, res: Response) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      error: "Failed to fetch users",
      details: (error as Error).message,
    });
  }
});

app.get("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.put("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", async (req: Request, res: Response) => {
  try {
    await userService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.get("/api/users/by-email/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }
    
    // URL decode the email in case it contains special characters
    const decodedEmail = decodeURIComponent(email);
    const user = await userService.getByEmail(decodedEmail);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Get user by email error:", error);
    res.status(500).json({ error: "Failed to fetch user by email" });
  }
});

app.get("/api/roles", async (req: Request, res: Response) => {
  try {
    const roles = await roleService.getAll();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

app.get("/api/roles/:id", async (req: Request, res: Response) => {
  try {
    const role = await roleService.getById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch role" });
  }
});

app.post("/api/roles", async (req: Request, res: Response) => {
  try {
    const role = await roleService.create(req.body);
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ error: "Failed to create role" });
  }
});

app.put("/api/roles/:id", async (req: Request, res: Response) => {
  try {
    const role = await roleService.update(req.params.id, req.body);
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: "Failed to update role" });
  }
});

app.delete("/api/roles/:id", async (req: Request, res: Response) => {
  try {
    await roleService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete role" });
  }
});

app.get("/api/menus", async (req: Request, res: Response) => {
  try {
    const menus = await menuService.getAll();
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menus" });
  }
});

app.get("/api/menus/:id", async (req: Request, res: Response) => {
  try {
    const menu = await menuService.getById(req.params.id);
    if (!menu) {
      return res.status(404).json({ error: "Menu not found" });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

app.post("/api/menus", async (req: Request, res: Response) => {
  try {
    const menu = await menuService.create(req.body);
    res.status(201).json(menu);
  } catch (error) {
    res.status(500).json({ error: "Failed to create menu" });
  }
});

app.put("/api/menus/:id", async (req: Request, res: Response) => {
  try {
    const menu = await menuService.update(req.params.id, req.body);
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: "Failed to update menu" });
  }
});

app.delete("/api/menus/:id", async (req: Request, res: Response) => {
  try {
    await menuService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete menu" });
  }
});

app.get("/api/role-permissions", async (req: Request, res: Response) => {
  try {
    const permissions = await rolePermissionService.getAll();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch role permissions" });
  }
});

app.get("/api/role-permissions/:id", async (req: Request, res: Response) => {
  try {
    const permission = await rolePermissionService.getById(req.params.id);
    if (!permission) {
      return res.status(404).json({ error: "Role permission not found" });
    }
    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch role permission" });
  }
});

app.post("/api/role-permissions", async (req: Request, res: Response) => {
  try {
    const permission = await rolePermissionService.create(req.body);
    res.status(201).json(permission);
  } catch (error) {
    res.status(500).json({ error: "Failed to create role permission" });
  }
});

app.put("/api/role-permissions/:id", async (req: Request, res: Response) => {
  try {
    const permission = await rolePermissionService.update(
      req.params.id,
      req.body
    );
    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: "Failed to update role permission" });
  }
});

app.delete("/api/role-permissions/:id", async (req: Request, res: Response) => {
  try {
    await rolePermissionService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete role permission" });
  }
});

app.post("/api/role-permissions/bulk", async (req: Request, res: Response) => {
  try {
    const { roleId, permissions } = req.body;

    if (!roleId || !permissions || !Array.isArray(permissions)) {
      return res
        .status(400)
        .json({ error: "roleId and permissions array are required" });
    }

    const results = [];
    for (const perm of permissions) {
      const { menuId, canView, canCreate, canEdit, canDelete } = perm;
      const result = await rolePermissionService.setPermissions(
        roleId,
        menuId,
        {
          canView,
          canCreate,
          canEdit,
          canDelete,
        }
      );
      results.push(result);
    }

    res.json({
      message: `Updated ${results.length} permissions for role ${roleId}`,
      updatedPermissions: results,
    });
  } catch (error) {
    console.error("Bulk role permissions error:", error);
    res
      .status(500)
      .json({ error: "Failed to update role permissions in bulk" });
  }
});

app.get(
  "/api/role-permissions/role/:roleId",
  async (req: Request, res: Response) => {
    try {
      const permissions = await rolePermissionService.getByRoleId(
        req.params.roleId
      );
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch role permissions" });
    }
  }
);

app.get("/api/user-rights/:userId", async (req: Request, res: Response) => {
  try {
    // Get user and their role
    const user = await userService.getById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.roleId) {
      // For backward compatibility, if no role is set, return base permissions
      return res.json({
        user: {
          id: user.id,
          name: user.name,
          role: null,
        },
        permissions: [],
      });
    }

    // Get permissions for the user's role
    const permissions = await rolePermissionService.getByRoleId(user.roleId);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role || 'User', // Default to 'User' if role is null
      },
      permissions,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user rights" });
  }
});

app.get("/api/licenses", async (req: Request, res: Response) => {
  try {
    const licenses = await licenseService.getAll();
    res.json(licenses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch licenses" });
  }
});

app.get("/api/licenses/:id", async (req: Request, res: Response) => {
  try {
    const license = await licenseService.getById(req.params.id);
    if (!license) {
      return res.status(404).json({ error: "License not found" });
    }
    res.json(license);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch license" });
  }
});

app.post("/api/licenses", async (req: Request, res: Response) => {
  try {
    const license = await licenseService.create(req.body);
    res.status(201).json(license);
  } catch (error) {
    res.status(500).json({ error: "Failed to create license" });
  }
});

app.put("/api/licenses/:id", async (req: Request, res: Response) => {
  try {
    const license = await licenseService.update(req.params.id, req.body);
    res.json(license);
  } catch (error) {
    res.status(500).json({ error: "Failed to update license" });
  }
});

app.delete("/api/licenses/:id", async (req: Request, res: Response) => {
  try {
    await licenseService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete license" });
  }
});

app.post("/api/licenses/activate", async (req: Request, res: Response) => {
  try {
    const { licenseKey, productName, device } = req.body;

    if (!licenseKey || !device || !device.computerId) {
      return res.status(400).json({
        success: false,
        error: "INVALID_INPUT",
        message: "License key and device computerId are required",
      });
    }

    // Find the license by key
    const licenses = await licenseService.getAll();
    const license = licenses.find((l) => l.key === licenseKey);

    if (!license) {
      return res.status(404).json({
        success: false,
        error: "INVALID_LICENSE_KEY",
        message: "The provided license key is not valid or does not exist.",
      });
    }

    // Check if the license is already expired
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      await licenseService.update(license.id, { status: "Expired" });
      return res.status(400).json({
        success: false,
        error: "EXPIRED_LICENSE",
        message: "The license has expired.",
      });
    }

    // Get the plan to check device limit
    const plan = license.planId
      ? await planService.getById(license.planId)
      : null;
    const deviceLimit = plan ? plan.deviceLimit : 1; // Default to 1 if no plan

    // Check existing devices for this license
    const devices = await deviceService.getAll();
    const existingDevices = devices.filter((d) => d.licenseId === license.id);

    if (existingDevices.length >= deviceLimit) {
      return res.status(400).json({
        success: false,
        error: "DEVICE_LIMIT_REACHED",
        message:
          "The maximum number of devices for this license has been reached.",
      });
    }

    // Check if this computerId is already registered for this license
    const existingDevice = existingDevices.find(
      (d) => d.computerId === device.computerId
    );
    if (existingDevice) {
      // Update the existing device's last seen time
      const updatedDevice = await deviceService.update(existingDevice.id, {});

      return res.status(200).json({
        success: true,
        message: "Device heartbeat received successfully. License is active.",
        license: {
          key: license.key,
          isActive: license.status === "Active",
          expiresAt: license.expiresAt,
        },
        device: updatedDevice,
      });
    }

    // Create new device
    const newDevice = await deviceService.create({
      licenseId: license.id,
      computerId: device.computerId,
      name: device.name || "Unknown Device",
      os: device.os,
      processor: device.processor,
      ram: device.ram,
      isActive: true,
    });

    // Update license status to active if it wasn't already
    if (license.status !== "Active") {
      await licenseService.update(license.id, { status: "Active" });
    }

    res.status(200).json({
      success: true,
      message: "License activated successfully.",
      license: {
        key: license.key,
        isActive: true,
        expiresAt: license.expiresAt,
      },
      device: newDevice,
    });
  } catch (error) {
    console.error("License activation error:", error);
    res.status(500).json({
      success: false,
      error: "ACTIVATION_ERROR",
      message: "An error occurred during license activation.",
    });
  }
});

app.post("/api/devices/heartbeat", async (req: Request, res: Response) => {
  try {
    const { licenseKey, computerId } = req.body;

    if (!licenseKey || !computerId) {
      return res.status(400).json({
        success: false,
        error: "MISSING_PARAMETERS",
        message: "License key and computer ID are required",
      });
    }

    // Find the license by key
    const licenses = await licenseService.getAll();
    const license = licenses.find((l) => l.key === licenseKey);

    if (!license) {
      return res.status(404).json({
        success: false,
        error: "LICENSE_NOT_FOUND",
        message: "The provided license key does not exist.",
      });
    }

    // Find the device by license and computer ID
    const devices = await deviceService.getAll();
    const device = devices.find(
      (d) => d.licenseId === license.id && d.computerId === computerId
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        error: "DEVICE_NOT_FOUND",
        message:
          "No active device with the specified computerId was found for this license.",
      });
    }

    // Update the last seen time - handled automatically by the service when updating any field
    await deviceService.update(device.id, {});

    // Check license expiration
    let licenseStatus = license.status;
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      licenseStatus = "expired";
      // Update the license status in the database
      await licenseService.update(license.id, { status: "Expired" });
    }

    res.status(200).json({
      success: true,
      licenseStatus: licenseStatus.toLowerCase(),
      message:
        "Heartbeat received. License is " + licenseStatus.toLowerCase() + ".",
    });
  } catch (error) {
    console.error("Heartbeat error:", error);
    res.status(500).json({
      success: false,
      error: "HEARTBEAT_ERROR",
      message: "An error occurred during heartbeat.",
    });
  }
});

// API routes for devices
app.get("/api/devices", async (req: Request, res: Response) => {
  try {
    const devices = await deviceService.getAll();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch devices" });
  }
});

app.get("/api/devices/:id", async (req: Request, res: Response) => {
  try {
    const device = await deviceService.getById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch device" });
  }
});

app.post("/api/devices", async (req: Request, res: Response) => {
  try {
    const device = await deviceService.create(req.body);
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ error: "Failed to create device" });
  }
});

app.put("/api/devices/:id", async (req: Request, res: Response) => {
  try {
    const device = await deviceService.update(req.params.id, req.body);
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: "Failed to update device" });
  }
});

app.delete("/api/devices/:id", async (req: Request, res: Response) => {
  try {
    await deviceService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete device" });
  }
});

app.get("/api/device-info", async (req: Request, res: Response) => {
  try {
    const deviceInfo = await getFullDeviceInfo();
    res.json(deviceInfo);
  } catch (error) {
    console.error("Get device info error:", error);
    res.status(500).json({ error: "Failed to retrieve device information" });
  }
});

// API routes for invoices
app.get("/api/invoices", async (req: Request, res: Response) => {
  try {
    const invoices = await invoiceService.getAll();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

app.get("/api/invoices/:id", async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

app.post("/api/invoices", async (req: Request, res: Response) => {
  console.log("POST /api/invoices - Request body:", req.body);
  try {
    const { status, lineItems, ...invoiceData } = req.body;

    // Ensure companyId and bankId can be null/undefined
    const invoiceWithDefaultStatus = {
      ...invoiceData,
      lineItems: lineItems || [], // Include lineItems in the invoice data
      // Note: status is not included here - it will be set to 'Unpaid' in the service
      companyId: invoiceData.companyId || null,
      bankId: invoiceData.bankId || null,
    };

    // Validate required fields
    if (!invoiceWithDefaultStatus.companyId) {
      return res.status(400).json({ error: "companyId is required" });
    }

    if (!invoiceWithDefaultStatus.issueDate) {
      return res.status(400).json({ error: "issueDate is required" });
    }

    if (!invoiceWithDefaultStatus.dueDate) {
      return res.status(400).json({ error: "dueDate is required" });
    }

    // Calculate total if not provided based on line items
    if (!invoiceWithDefaultStatus.total && invoiceWithDefaultStatus.lineItems.length > 0) {
      const calculatedTotal = invoiceWithDefaultStatus.lineItems.reduce(
        (sum: number, item: { total: number }) => sum + item.total, 0
      );
      invoiceWithDefaultStatus.total = calculatedTotal;
    }

    // Validate line items if provided
    if (invoiceWithDefaultStatus.lineItems && Array.isArray(invoiceWithDefaultStatus.lineItems)) {
      for (const item of invoiceWithDefaultStatus.lineItems) {
        if (!item.planId) {
          return res.status(400).json({ error: "Each line item must have a planId" });
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          return res.status(400).json({ error: "Each line item must have a valid positive quantity" });
        }
        if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
          return res.status(400).json({ error: "Each line item must have a valid non-negative unitPrice" });
        }
        if (typeof item.total !== 'number' || item.total < 0) {
          return res.status(400).json({ error: "Each line item must have a valid non-negative total" });
        }
      }
    }

    const invoice = await invoiceService.create(invoiceWithDefaultStatus);
    console.log("POST /api/invoices - Created invoice:", invoice);
    res.status(201).json(invoice);
  } catch (error) {
    console.error("POST /api/invoices - Error:", error);
    res.status(500).json({
      error: "Failed to create invoice",
      details: (error as Error).message,
    });
  }
});

app.put("/api/invoices/:id", async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.update(req.params.id, req.body);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

app.delete("/api/invoices/:id", async (req: Request, res: Response) => {
  try {
    await invoiceService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

app.get("/api/activity-logs", async (req: Request, res: Response) => {
  try {
    const activityLogs = await activityLogService.getAll();
    res.json(activityLogs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

app.get("/api/activity-logs/:id", async (req: Request, res: Response) => {
  try {
    const activityLog = await activityLogService.getById(req.params.id);
    if (!activityLog) {
      return res.status(404).json({ error: "Activity log not found" });
    }
    res.json(activityLog);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activity log" });
  }
});

app.post("/api/activity-logs", async (req: Request, res: Response) => {
  try {
    const activityLog = await activityLogService.create(req.body);
    res.status(201).json(activityLog);
  } catch (error) {
    res.status(500).json({ error: "Failed to create activity log" });
  }
});
app.delete("/api/activity-logs/clear", async (req: Request, res: Response) => {
  console.log("DELETE /api/activity-logs/clear - Request received");
  try {
    console.log(
      "DELETE /api/activity-logs/clear - Calling activityLogService.deleteAll()"
    );
    const result = await activityLogService.deleteAll();
    console.log(
      "DELETE /api/activity-logs/clear - deleteAll completed, result:",
      result
    );
    res.status(204).send();
  } catch (error) {
    console.error("DELETE /api/activity-logs/clear - Error:", error);
    res.status(500).json({
      error: "Failed to delete all activity logs",
      details: (error as Error).message,
    });
  }
});
app.delete("/api/activity-logs/:id", async (req: Request, res: Response) => {
  try {
    await activityLogService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete activity log" });
  }
});

// API routes for banks
app.get("/api/banks", async (req: Request, res: Response) => {
  try {
    const banks = await bankService.getAll();
    res.json(banks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

app.get("/api/banks/:id", async (req: Request, res: Response) => {
  try {
    const bank = await bankService.getById(req.params.id);
    if (!bank) {
      return res.status(404).json({ error: "Bank not found" });
    }
    res.json(bank);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bank" });
  }
});

app.post("/api/banks", async (req: Request, res: Response) => {
  try {
    const bank = await bankService.create(req.body);
    res.status(201).json(bank);
  } catch (error) {
    res.status(500).json({ error: "Failed to create bank" });
  }
});

app.put("/api/banks/:id", async (req: Request, res: Response) => {
  try {
    const bank = await bankService.update(req.params.id, req.body);
    res.json(bank);
  } catch (error) {
    res.status(500).json({ error: "Failed to update bank" });
  }
});

app.delete("/api/banks/:id", async (req: Request, res: Response) => {
  try {
    await bankService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete bank" });
  }
});

// Authentication endpoints

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Determine the correct static directory based on whether we're running from src or dist
// If __dirname contains 'dist', we're running from a compiled version, so go up one more level
const isCompiled = __dirname.includes('dist');
const staticDir = isCompiled 
  ? path.join(__dirname, "../../dist")  // Go up two levels if running from dist/server
  : path.join(__dirname, "../dist");    // Go up one level if running from server/

// Serve static files from the dist folder
app.use(express.static(staticDir));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    service: "License Management Dashboard",
    timestamp: new Date().toISOString(),
  });
});

// Catch-all route to serve index.html for SPA routing (only for non-API routes)
app.get("*", (req: Request, res: Response) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/api-docs")) {
    // If it's an API route, don't serve index.html
    res.status(404).json({ error: "Route not found" });
  } else {
    // For all other routes, serve the frontend
    res.sendFile(path.join(staticDir, "index.html"));
  }
});

// Start server
const port = parseInt(process.env.PORT || "5000"); // Changed back to port 5000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`API endpoints available at http://localhost:${port}/api`);
  console.log(
    `Swagger documentation available at http://localhost:${port}/api-docs`
  );
});
