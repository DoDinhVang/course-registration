import bcrypt from "bcryptjs";
import prisma from "../common/helpers/prisma.js";
import { AppError } from "../common/middlware/error.middleware.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../common/helpers/jwt.js";

export const register = async ({ studentCode, name, email, password }) => {
  // 1. Check if studentCode already exists
  const existingCode = await prisma.student.findUnique({
    where: { studentCode },
  });
  if (existingCode) {
    throw new AppError("Mã sinh viên đã tồn tại trên hệ thống.", 400);
  }

  // 2. Check if email already exists
  const existingEmail = await prisma.student.findUnique({ where: { email } });
  if (existingEmail) {
    throw new AppError("Email đã được sử dụng.", 400);
  }

  // 3. Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 4. Create student
  const student = await prisma.student.create({
    data: {
      studentCode,
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      studentCode: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  return student;
};

export const login = async ({ email, password }) => {
  // 1. Find student by email
  const student = await prisma.student.findFirst({
    where: { email: email },
  });

  if (!student) {
    throw new AppError("Email hoặc mật khẩu không chính xác.", 401);
  }


  // 2. Compare password
  const isMatch = await bcrypt.compare(password, student.password);
  if (!isMatch) {
    throw new AppError("Email hoặc mật khẩu không chính xác.", 401);
  }

  // 3. Check status
  if (student.status !== "ACTIVE") {
    throw new AppError(
      "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.",
      403,
    );
  }

  // 4. Generate tokens
  const payload = {
    id: student.id,
    studentCode: student.studentCode,
    email: student.email,
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // 5. Save refresh token to database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      studentId: student.id,
      expiresAt,
    },
  });

  // Extract student details without password
  const { password: _, ...studentWithoutPassword } = student;

  return {
    student: studentWithoutPassword,
    accessToken,
    refreshToken,
  };
};

export const refresh = async (oldRefreshToken) => {
  if (!oldRefreshToken) {
    throw new AppError("Refresh token là bắt buộc.", 400);
  }

  // 1. Verify old token signature & expiry
  const decoded = verifyRefreshToken(oldRefreshToken);
  if (!decoded) {
    throw new AppError("Refresh token không hợp lệ hoặc đã hết hạn.", 401);
  }

  // 2. Find token in DB
  const dbToken = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
    include: {
      student: true,
    },
  });

  if (!dbToken) {
    throw new AppError("Refresh token không tồn tại hoặc đã bị thu hồi.", 401);
  }

  // 3. Check if token is expired in DB
  if (dbToken.expiresAt < new Date()) {
    await prisma.refreshToken
      .delete({ where: { token: oldRefreshToken } })
      .catch(() => {});
    throw new AppError("Refresh token đã hết hạn.", 401);
  }

  // 4. Check if student is active
  if (dbToken.student.status !== "ACTIVE") {
    throw new AppError("Tài khoản sinh viên đã bị khóa.", 403);
  }

  // 5. Token rotation: delete old token, generate new ones
  await prisma.refreshToken
    .delete({ where: { token: oldRefreshToken } })
    .catch(() => {});

  const payload = {
    id: dbToken.student.id,
    studentCode: dbToken.student.studentCode,
    email: dbToken.student.email,
  };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      studentId: dbToken.student.id,
      expiresAt,
    },
  });

  const { password: _, ...studentWithoutPassword } = dbToken.student;

  return {
    student: studentWithoutPassword,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (refreshToken) => {
  if (refreshToken) {
    // Delete the refresh token from DB
    await prisma.refreshToken
      .delete({
        where: { token: refreshToken },
      })
      .catch(() => {
        // Ignore if token doesn't exist or already deleted
      });
  }
  return true;
};
