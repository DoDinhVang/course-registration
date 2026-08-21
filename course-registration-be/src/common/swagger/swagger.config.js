import swaggerJsdoc from "swagger-jsdoc";
import * as AppConfig from "../../common/config/app.config.js";

const PORT = AppConfig.PORT;

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "Course Registration API",
    version: "1.0.0",
    description:
      "API đăng ký học phần cho sinh viên: xác thực, quản lý học kỳ/học phần, đăng ký/huỷ đăng ký học phần (xử lý an toàn dưới tải đồng thời cao) và xuất phiếu đăng ký ra Word.",
  },
  servers: [{ url: `http://localhost:${PORT}/api`, description: "Local" }],
  tags: [
    {
      name: "Auth",
      description: "Đăng ký tài khoản, đăng nhập, refresh/logout token",
    },
    { name: "Semesters", description: "Học kỳ và học phần thuộc học kỳ" },
    {
      name: "Register",
      description: "Đăng ký / huỷ đăng ký / xuất phiếu đăng ký học phần",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Access token nhận được từ POST /auth/login hoặc /auth/refresh. Gửi kèm header: Authorization: Bearer <accessToken>",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 400 },
          message: { type: "string", example: "Dữ liệu không hợp lệ." },
          stack: { type: "string", nullable: true },
        },
      },
      Student: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          studentCode: { type: "string", example: "SV001" },
          name: { type: "string", example: "Nguyễn Văn A" },
          email: {
            type: "string",
            format: "email",
            example: "sv001@example.com",
          },
          status: { type: "string", example: "ACTIVE" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Semester: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          code: { type: "string", example: "2026-1" },
          name: { type: "string", example: "Học kỳ 1 - Năm học 2026-2027" },
          startDate: { type: "string", format: "date-time", nullable: true },
          endDate: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Course: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          code: { type: "string", example: "IT001" },
          name: { type: "string", example: "Nhập môn lập trình" },
        },
      },
      CourseSemester: {
        type: "object",
        properties: {
          id: { type: "integer", example: 11 },
          courseId: { type: "integer", example: 1 },
          semesterId: { type: "integer", example: 1 },
          capacity: { type: "integer", example: 60 },
          registeredCount: { type: "integer", example: 12 },
          course: { $ref: "#/components/schemas/Course" },
          semester: { $ref: "#/components/schemas/Semester" },
        },
      },
      Registration: {
        type: "object",
        properties: {
          id: { type: "integer", example: 55 },
          studentId: { type: "integer", example: 1 },
          courseSemesterId: { type: "integer", example: 11 },
          status: {
            type: "string",
            enum: ["PENDING", "CONFIRMED", "WAITLISTED", "CANCELLED", "FAILED"],
            example: "CONFIRMED",
          },
          registeredAt: { type: "string", format: "date-time" },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      RegisterCourseFailure: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          courseSemesterId: { type: "integer", example: 15 },
          message: { type: "string", example: "Lớp học phần đã hết chỗ." },
          statusCode: { type: "integer", example: 409 },
        },
      },
      RegisterCourseSuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          courseSemesterId: { type: "integer", example: 11 },
          registration: { $ref: "#/components/schemas/Registration" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ["./src/routers/*.router.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
