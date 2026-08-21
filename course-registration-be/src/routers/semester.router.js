import express from "express";
import * as semesterController from "../controllers/semester.controller.js";
import { protect } from "../common/middlware/auth.middleware.js";
const router = express.Router();

/**
 * @swagger
 * /semesters:
 *   get:
 *     summary: Lấy danh sách học kỳ
 *     tags: [Semesters]
 *     responses:
 *       200:
 *         description: Danh sách học kỳ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Semester' }
 */
router.get("/", protect, semesterController.getSemesterList);

/**
 * @swagger
 * /semesters:
 *   post:
 *     summary: Tạo học kỳ mới
 *     tags: [Semesters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string, example: "2026-1" }
 *               name: { type: string, example: "Học kỳ 1 - Năm học 2026-2027" }
 *     responses:
 *       200:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post("/", protect, semesterController.createSemester);

/**
 * @swagger
 * /semesters/{semesterId}/courses:
 *   get:
 *     summary: Lấy danh sách lớp học phần (course-semester) thuộc 1 học kỳ
 *     tags: [Semesters]
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Danh sách lớp học phần
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CourseSemester' }
 */
router.get(
  "/:semesterId/courses",
  protect,
  semesterController.getCoursesBySemesterId,
);

/**
 * @swagger
 * /semesters/{semesterId}/courses:
 *   post:
 *     summary: Thêm hàng loạt môn học vào 1 học kỳ (tạo các lớp course-semester)
 *     tags: [Semesters]
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseIds]
 *             properties:
 *               courseIds:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Thêm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     requested: { type: integer, example: 3 }
 *                     inserted: { type: integer, example: 2 }
 *                     skipped: { type: integer, example: 1 }
 *       404:
 *         description: Học kỳ không tồn tại
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
  "/:semesterId/courses",
  protect,
  semesterController.bulkAddCoursesToSemester,
);
export default router;
