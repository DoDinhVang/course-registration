import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../common/middlware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản sinh viên
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentCode, name, email, password]
 *             properties:
 *               studentCode:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 example: SV001
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               email:
 *                 type: string
 *                 format: email
 *                 example: sv001@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Student' }
 *       400:
 *         description: Dữ liệu không hợp lệ, mã sinh viên/email đã tồn tại
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
// Public routes
router.post("/register", authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập, nhận access token (và refresh token qua cookie httpOnly)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: sv001@example.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     student: { $ref: '#/components/schemas/Student' }
 *                     accessToken: { type: string }
 *       401:
 *         description: Sai email/mật khẩu
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Làm mới access token bằng refresh token (đọc từ cookie httpOnly)
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Cấp access token mới
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     student: { $ref: '#/components/schemas/Student' }
 *                     accessToken: { type: string }
 *       401:
 *         description: Refresh token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất, thu hồi refresh token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin sinh viên đang đăng nhập
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Thông tin sinh viên
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Student' }
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
// Protected routes (require valid JWT)
router.get("/me", protect, authController.getMe);

export default router;
