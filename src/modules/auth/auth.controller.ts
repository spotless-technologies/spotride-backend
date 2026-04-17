import { Request, Response } from 'express';
import * as authService from './auth.service';
import * as dto from './auth.dto';

export const registerEmail = async (req: Request, res: Response) => {
  try {
    const data = dto.emailSignupSchema.parse(req.body);
    const result = await authService.registerEmail(data);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Registration failed" });
  }
};

export const registerPhone = async (req: Request, res: Response) => {
  try {
    const data = dto.phoneSignupSchema.parse(req.body);
    const result = await authService.registerPhone(data);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Registration failed" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = dto.verifyOtpSchema.parse(req.body);

    // Verify OTP and create profile
    const user = await authService.verifyOtp(userId, otp);

    // Generate fresh tokens 
    const { accessToken, refreshToken } = await authService.generateTokensForUser(user.id);

    // Set httpOnly refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return access token to frontend
    return res.json({
      accessToken,
      message: "Account verified successfully",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });

  } catch (error: any) {
    if (error.message === "Invalid or expired OTP") {
      return res.status(400).json({ message: "Invalid or expired OTP. Please request a new one." });
    }

    console.error("Verify OTP error:", error);
    return res.status(500).json({ 
      message: "Something went wrong while verifying your account. Please try again." 
    });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = dto.googleAuthSchema.parse(req.body);
    const user = await authService.googleAuth(idToken);

    const { accessToken, refreshToken } = await authService.refreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Google authentication failed" });
  }
};

export const facebookAuth = async (req: Request, res: Response) => {
  try {
    const { accessToken } = dto.facebookAuthSchema.parse(req.body);
    const user = await authService.facebookAuth(accessToken);

    const { accessToken: jwtAccess, refreshToken } = await authService.refreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    res.json({ accessToken: jwtAccess });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Facebook authentication failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = dto.loginSchema.parse(req.body);

    // Validate credentials
    const user = await authService.login(identifier, password);

    // Generate fresh tokens 
    const { accessToken, refreshToken } = await authService.generateTokensForUser(user.id);

    // Set httpOnly refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return access token + basic user info
    return res.json({
      accessToken,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });

  } catch (error: any) {
    if (error.message.includes("Invalid email") || error.message.includes("Invalid credentials")) {
      return res.status(401).json({ 
        message: "Invalid email/phone or password. Please check your credentials." 
      });
    }

    console.error("Login error:", error);
    return res.status(500).json({ 
      message: "Something went wrong during login. Please try again." 
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new Error("No refresh token provided");

    const { accessToken, refreshToken: newRefresh } = await authService.refreshToken(refreshToken);

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    res.json({ accessToken });
  } catch (error: any) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { identifier } = dto.forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(identifier);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to process request" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { identifier, otp, newPassword } = dto.resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(identifier, otp, newPassword);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Password reset failed" });
  }
};