import { Request, Response, NextFunction } from "express";
import validator from "validator";
import xss from "xss";

interface LoginInput {
  email: string;
  password: string;
}

interface SanitizedLoginInput {
  email: string;
  password: string;
}

declare global {
  namespace Express {
    interface Request {
      validatedLoginData?: SanitizedLoginInput;
    }
  }
}

export function validateLoginUserInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { email, password } = req.body;

    // Check all fields exist
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Trim inputs
    const trimmedInputs = {
      email: email.trim(),
      password: password.trim(),
    };

    // Validate email format
    if (!validator.isEmail(trimmedInputs.email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // XSS Sanitization
    const sanitized = {
      email: xss(
        validator.normalizeEmail(trimmedInputs.email) || trimmedInputs.email
      ),
      password: trimmedInputs.password,
    };

    // SQL Injection check
    const sqlInjectionPattern =
      /(\b(SELECT|INSERT|DELETE|UPDATE|DROP|UNION|EXEC|ALTER)\b)|('|--|;|\/\*|\*\/)/i;
    if (sqlInjectionPattern.test(sanitized.email)) {
      res.status(400).json({ error: "Invalid characters detected in email" });
      return;
    }

    // Prepare validated data for controller
    req.validatedLoginData = sanitized;
    next();
  } catch (error) {
    console.error("Login validation error:", error);
    res.status(500).json({ error: "Login validation failed" });
  }
}
