import { verifyAccessToken } from "../helpers/jwt.js";
import prisma from "../helpers/prisma.js";
import { AppError } from "./error.middleware.js";

export const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Get token from Authorization header (Bearer token) or from Cookie
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(
        new AppError(
          "Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.",
          401,
        ),
      );
    }

    // 2. Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(
        new AppError(
          "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          401,
        ),
      );
    }

    // 3. Find student in database
    const student = await prisma.student.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        studentCode: true,
        name: true,
        email: true,
        status: true,
      },
    });

    if (!student) {
      return next(new AppError("Sinh viên không tồn tại trong hệ thống.", 401));
    }

    // 4. Check if account is locked
    if (student.status !== "ACTIVE") {
      return next(
        new AppError(
          "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.",
          403,
        ),
      );
    }

    // 5. Grant access and store student info in request
    req.user = student;
    next();
  } catch (error) {
    next(error);
  }
};
