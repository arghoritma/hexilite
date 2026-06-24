import { Request, Response } from "hyper-express";
import { hashPassword, verifyPassword } from "../utils/hash";
import { db } from "../config/native-database";
import { v4 as uuid } from "uuid";
import { AuthService } from "../services/auth";
import { SessionService } from "../services/session";
import { AuthRequest } from "../middlewares/auth";

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
}

export default class UserController {
  private static authServiceInstance: AuthService | null = null;

  private static getAuthService(): AuthService {
    if (!UserController.authServiceInstance) {
      const sessionService = new SessionService()
      UserController.authServiceInstance = new AuthService(sessionService)
    }
    return UserController.authServiceInstance
  }

  static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body as RegisterRequest;

      const existingUser = db("users").where("email", email).first();
      if (existingUser) {
        return res.status(400).json({
          code: "USER_EXISTS",
          message: "User with this email already exists",
        });
      }

      const hashedPassword = await hashPassword(password);
      const userId = uuid();

      const user = db("users")
        .insertReturning({
          id: userId,
          name,
          email,
          password: hashedPassword,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, ['id', 'name', 'email', 'created_at'])

      res.status(201).json({
        code: "REGISTER_SUCCESS",
        message: "User registered successfully",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.created_at,
          },
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({
        code: "REGISTER_ERROR",
        message: "Error registering user",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password, deviceId } = req.body as LoginRequest;

      const user = db("users").where("email", email).first();
      if (!user) {
        return res.status(401).json({
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        });
      }

      const validPassword = await verifyPassword(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        });
      }

      const authService = UserController.getAuthService();

      const userAgent = req.headers["user-agent"] || "unknown";
      const ip = req.ip || "unknown";

      const loginResult = await authService.login(
        user,
        userAgent,
        ip,
        deviceId
      );

      res.json({
        code: "LOGIN_SUCCESS",
        message: "Login successful",
        data: {
          accessToken: loginResult.accessToken,
          refreshToken: loginResult.refreshToken,
          user: loginResult.user,
          session: loginResult.session,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        code: "LOGIN_ERROR",
        message: "Error during login",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body as { refreshToken: string };

      if (!refreshToken) {
        return res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Refresh token is required",
        });
      }

      const authService = UserController.getAuthService();

      const result = await authService.refreshAccessToken(refreshToken);

      res.json({
        code: "REFRESH_SUCCESS",
        message: "Token refreshed successfully",
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(401).json({
        code: "REFRESH_ERROR",
        message: "Failed to refresh token",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async logout(req: AuthRequest, res: Response) {
    try {
      const sessionId = req.user?.sessionId;

      if (!sessionId) {
        return res.status(401).json({
          code: "UNAUTHORIZED",
          message: "No active session found",
        });
      }

      const authService = UserController.getAuthService();

      await authService.logout(sessionId);

      res.json({
        code: "LOGOUT_SUCCESS",
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        code: "LOGOUT_ERROR",
        message: "Error during logout",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async logoutAllDevices(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const authService = UserController.getAuthService();

      await authService.logoutAllDevices(userId);

      res.json({
        code: "LOGOUT_ALL_SUCCESS",
        message: "Logged out from all devices successfully",
      });
    } catch (error) {
      console.error("Logout all devices error:", error);
      res.status(500).json({
        code: "LOGOUT_ALL_ERROR",
        message: "Error logging out from all devices",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async getSessions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const authService = UserController.getAuthService();

      const sessions = await authService.getUserActiveSessions(userId);

      res.json({
        code: "SUCCESS",
        message: "Sessions retrieved successfully",
        data: {
          sessions: sessions.map((session: any) => ({
            sessionId: session.sessionId,
            deviceId: session.deviceId,
            userAgent: session.userAgent,
            ip: session.ip,
            createdAt: session.createdAt,
            expiredAt: session.expiredAt,
          })),
        },
      });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({
        code: "SESSIONS_ERROR",
        message: "Error fetching sessions",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
