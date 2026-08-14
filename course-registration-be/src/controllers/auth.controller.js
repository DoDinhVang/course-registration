import { z } from "zod";
import * as authService from "../services/auth.service.js";
import {
  loginSchema,
  registerSchema,
} from "../common/schemas/students.schema.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const student = await authService.register(validatedData.data);

    res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản sinh viên thành công.",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const { student, accessToken, refreshToken } = await authService.login(
      validatedData.data,
    );

    // Set refresh token in secure HTTP-only cookie
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công.",
      data: {
        student,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;
    const { student, accessToken, refreshToken } =
      await authService.refresh(oldRefreshToken);

    // Set new refresh token in cookie
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: "Làm mới access token thành công.",
      data: {
        student,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await authService.logout(refreshToken);

    // Clear HTTP-only cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công.",
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};
