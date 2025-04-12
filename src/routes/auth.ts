import { Router } from "express";
import { userClient } from "../grpc/userClient";
import { validateRegisterUserInput } from "../middlewares/validateRegisterUserInput";
import * as argon2 from "argon2";
import { validateLoginUserInput } from "../middlewares/validateLoginUserInput";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", validateLoginUserInput, (req, res) => {
  (async () => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const response = await userClient.loginUser(email);

      if (!response || !response.email) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const passwordMatches = await argon2.verify(response.password, password);
      if (!passwordMatches) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET not configured");
      }

      const token = jwt.sign(
        {
          userId: response.userId,
          email: response.email,
          userName: response.userName,
        },
        jwtSecret,
        { expiresIn: "7d" }
      );

      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: process.env.COOKIE_DOMAIN || undefined,
      });

      return res.status(200).json({
        message: "Login successful",
        user: {
          email: response.email,
          userName: response.userName,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ error: error?.details || "Login failed" });
    }
  })();
});

router.post("/register", validateRegisterUserInput, (req, res) => {
  (async () => {
    try {
      const { fullName, userName, emailAddress, phoneNumber, password } =
        req.validatedData!;

      // Argon2 hashing with recommended parameters
      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id, // Hybrid version (default)
        memoryCost: 19456, // 19MB memory usage (OWASP recommended)
        timeCost: 2, // 2 iterations
        parallelism: 1, // Number of threads
        hashLength: 32, // Output size (32 bytes)
      });

      const response = await userClient.registerUser(
        fullName,
        userName,
        emailAddress,
        phoneNumber,
        hashedPassword
      );

      return res.status(200).json({
        message: "Registration successful",
        user: {
          userName: response.userName,
        },
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      return res
        .status(500)
        .json({ error: error?.details || "Registration failed" });
    }
  })();
});

export default router;
