import express from "express";
import * as registerController from "../controllers/register.controller.js";
import { protect } from "../common/middlware/auth.middleware.js";

const router = express.Router();
router.use(protect);

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Đăng ký 1 hoặc nhiều lớp học phần
 *     description: >
 *       Xử lý độc lập từng courseSemesterId (partial success): 1 lớp hết chỗ hoặc đã đăng ký trước đó
 *       không làm hỏng việc đăng ký các lớp còn lại trong cùng request. Việc giữ chỗ được thực hiện
 *       nguyên tử ở tầng DB để đảm bảo không oversell khi nhiều sinh viên đăng ký đồng thời.
 *     tags: [Register]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseSemesterIds]
 *             properties:
 *               courseSemesterIds:
 *                 type: array
 *                 items: { type: integer }
 *                 minItems: 1
 *                 maxItems: 20
 *                 example: [11, 15]
 *     responses:
 *       200:
 *         description: Đã xử lý (xem success/failed để biết từng lớp có đăng ký được hay không)
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
 *                     success:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/RegisterCourseSuccess' }
 *                     failed:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/RegisterCourseFailure' }
 *       400:
 *         description: courseSemesterIds rỗng hoặc không hợp lệ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Chưa đăng nhập
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post("/", registerController.register);

/**
 * @swagger
 * /register:
 *   get:
 *     summary: Danh sách đăng ký học phần của sinh viên đang đăng nhập
 *     tags: [Register]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, WAITLISTED, CANCELLED, FAILED]
 *         description: Lọc theo trạng thái. Bỏ trống để lấy toàn bộ lịch sử.
 *     responses:
 *       200:
 *         description: Danh sách đăng ký
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Registration' }
 *       400:
 *         description: status không hợp lệ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get("/", registerController.getMyRegistrations);

/**
 * @swagger
 * /register/export:
 *   get:
 *     summary: Xuất phiếu đăng ký học phần ra file Word (.docx)
 *     description: >
 *       Mặc định chỉ xuất các học phần đang CONFIRMED. Dùng status=ALL để xuất toàn bộ lịch sử
 *       (kể cả đã huỷ), hoặc chỉ định 1 trạng thái cụ thể.
 *     tags: [Register]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ALL, PENDING, CONFIRMED, WAITLISTED, CANCELLED, FAILED]
 *         description: Mặc định CONFIRMED. Dùng ALL để lấy toàn bộ lịch sử.
 *     responses:
 *       200:
 *         description: File Word phiếu đăng ký học phần
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema: { type: string, format: binary }
 *       400:
 *         description: status không hợp lệ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get("/export", registerController.exportRegistrations);

/**
 * @swagger
 * /register/{id}:
 *   delete:
 *     summary: Huỷ đăng ký học phần (được phép huỷ bất kỳ lúc nào)
 *     tags: [Register]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: id của bản ghi đăng ký (registration), không phải courseSemesterId
 *     responses:
 *       200:
 *         description: Huỷ thành công, chỗ trống được hoàn trả ngay lập tức
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Registration' }
 *       403:
 *         description: Đăng ký này không thuộc về sinh viên đang đăng nhập
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Không tìm thấy đăng ký
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Đăng ký này đã được huỷ trước đó
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete("/:id", registerController.cancel);

export default router;
