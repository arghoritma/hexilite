import { Response } from "hyper-express";
import db from "../config/database";
import { AuthRequest } from "../middlewares/auth";

export default class UserController {

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      console.log("Fetching profile for user ID:", userId);

      if (!userId) {
        return res.status(401).json({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const user = await db("users")
        .where({ id: userId })
        .select(["id", "name", "email", "created_at", "updated_at"])
        .first();

      if (!user) {
        return res.status(404).json({
          code: "USER_NOT_FOUND",
          message: "User not found",
        });
      }

      res.json({
        code: "SUCCESS",
        message: "Profile retrieved successfully",
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        code: "PROFILE_ERROR",
        message: "Error fetching profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

}
