import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import xss from 'xss';

// Kenyan phone number validation
const validateKenyanPhone = (phone: string): { valid: boolean; formatted?: string; error?: string } => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    // Handle different input formats
    if (digitsOnly.startsWith('254') && digitsOnly.length === 12) {
        return { valid: true, formatted: digitsOnly };
    }
    
    if (digitsOnly.startsWith('07') && digitsOnly.length === 10) {
        return { valid: true, formatted: `254${digitsOnly.substring(1)}` };
    }
    
    if (digitsOnly.startsWith('7') && digitsOnly.length === 9) {
        return { valid: true, formatted: `254${digitsOnly}` };
    }
    
    if (digitsOnly.startsWith('254') && digitsOnly.length > 12) {
        const normalized = `254${digitsOnly.substring(3).replace(/^0+/, '')}`;
        if (normalized.length === 12) {
            return { valid: true, formatted: normalized };
        }
    }

    return {
        valid: false,
        error: "Phone number must be in format 254XXXXXXXXX, 07XXXXXXXX, or 7XXXXXXXX"
    };
};

interface SanitizedUserInput {
    fullName: string;
    userName: string;
    emailAddress: string;
    phoneNumber: string;
    password: string;
}

export function validateRegisterUserInput(req: Request, res: Response, next: NextFunction): void {
    try {
        const { fullName, userName, emailAddress, phoneNumber, password } = req.body;

        // Check all fields exist
        if (!fullName || !userName || !emailAddress || !phoneNumber || !password) {
            res.status(400).json({ error: "All fields must be filled" });
            return
        }

        // Trim all inputs
        const trimmedInputs = {
            fullName: fullName.trim(),
            userName: userName.trim(),
            emailAddress: emailAddress.trim(),
            phoneNumber: phoneNumber.trim(),
            password: password.trim()
        };

        // Validate email format
        if (!validator.isEmail(trimmedInputs.emailAddress)) {
            res.status(400).json({ error: "Invalid email address format" });
            return
        }

        // Validate and format phone number
        const phoneValidation = validateKenyanPhone(trimmedInputs.phoneNumber);
        if (!phoneValidation.valid) {
            res.status(400).json({ error: phoneValidation.error });
            return
        }
        const formattedPhone = phoneValidation.formatted!;

        // Validate password strength (OWASP recommendations)
        if (trimmedInputs.password.length < 12) {
            res.status(400).json({ 
                error: "Password must be at least 12 characters long" 
            });
            return
        }

        // XSS Sanitization
        const sanitized = {
            fullName: xss(trimmedInputs.fullName),
            userName: xss(trimmedInputs.userName),
            emailAddress: xss(validator.normalizeEmail(trimmedInputs.emailAddress) || trimmedInputs.emailAddress),
            phoneNumber: formattedPhone
        };

        // SQL Injection check
        const sqlInjectionPattern = /(\b(SELECT|INSERT|DELETE|UPDATE|DROP|UNION|EXEC|ALTER)\b)|('|--|;|\/\*|\*\/)/i;
        if (
            sqlInjectionPattern.test(sanitized.fullName) ||
            sqlInjectionPattern.test(sanitized.userName) ||
            sqlInjectionPattern.test(sanitized.emailAddress)
        ) {
            res.status(400).json({ error: "Invalid characters detected in input" });
            return
        }

        // Prepare validated data for controller
        req.validatedData = {
            fullName: sanitized.fullName,
            userName: sanitized.userName,
            emailAddress: sanitized.emailAddress,
            phoneNumber: sanitized.phoneNumber,
            password: trimmedInputs.password // Don't sanitize password (will be hashed)
        };

        next();
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({ error: "Input validation failed" });
    }
}

// Type augmentation for Express Request
declare global {
    namespace Express {
        interface Request {
            validatedData?: SanitizedUserInput;
        }
    }
}