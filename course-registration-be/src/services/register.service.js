import prisma from "../common/helpers/prisma.js";
import { AppError } from "../common/middlware/error.middleware.js";

const MAX_TX_RETRIES = 5;

const isRetryableTxError = (error) => {
  if (error.code === "P2034") return true; // Prisma: write conflict/deadlock
  const msg = String(error.message || "");
  return /deadlock/i.test(msg) || /write conflict/i.test(msg);
};

const runInTransaction = async (fn) => {
  let lastError;
  for (let attempt = 0; attempt < MAX_TX_RETRIES; attempt++) {
    try {

      return await prisma.$transaction(fn, { isolationLevel: "ReadCommitted" });
    } catch (error) {
      if (isRetryableTxError(error) && attempt < MAX_TX_RETRIES - 1) {
        lastError = error;
        const delayMs = 15 * (attempt + 1) + Math.floor(Math.random() * 25);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

const registerSingleCourse = async (studentId, courseSemesterId) => {
  return runInTransaction(async (tx) => {

    const existingRows = await tx.$queryRaw`
      SELECT id, status
      FROM registrations
      WHERE student_id = ${studentId} AND course_semester_id = ${courseSemesterId}
      FOR UPDATE
    `;
    const existing = existingRows[0];

    if (existing && existing.status === "CONFIRMED") {
      throw new AppError("Bạn đã đăng ký học phần này rồi.", 409);
    }
    const seatReserved = await tx.$executeRaw`
      UPDATE course_semesters
      SET registered_count = registered_count + 1
      WHERE id = ${courseSemesterId} AND registered_count < capacity
    `;
    if (seatReserved === 0) {

      const courseSemester = await tx.courseSemester.findUnique({
        where: { id: courseSemesterId },
        select: { id: true },
      });
      if (!courseSemester) {
        throw new AppError("Lớp học phần không tồn tại.", 404);
      }
      throw new AppError("Lớp học phần đã hết chỗ.", 409);
    }

    let registration;
    try {
      if (existing) {
        registration = await tx.registration.update({
          where: { id: existing.id },
          data: { status: "CONFIRMED", registeredAt: new Date(), cancelledAt: null },
        });
      } else {
        registration = await tx.registration.create({
          data: { studentId, courseSemesterId, status: "CONFIRMED" },
        });
      }
    } catch (error) {

      if (error.code === "P2002") {
        throw new AppError("Bạn đã đăng ký học phần này rồi.", 409);
      }
      throw error;
    }

    return registration;
  });
};

export const register = async (studentId, courseSemesterIds) => {
  const uniqueIds = [...new Set(courseSemesterIds)];

  const results = [];

  for (const courseSemesterId of uniqueIds) {
    try {
      const registration = await registerSingleCourse(studentId, courseSemesterId);
      results.push({ success: true, courseSemesterId, registration });
    } catch (error) {
      results.push({
        success: false,
        courseSemesterId,
        message: error.message || "Đăng ký thất bại.",
        statusCode: error.statusCode || 500,
      });
    }
  }

  return {
    success: results.filter((r) => r.success),
    failed: results.filter((r) => !r.success),
  };
};

export const cancelRegistration = async (studentId, registrationId) => {
  return runInTransaction(async (tx) => {

    const rows = await tx.$queryRaw`
      SELECT id, student_id, course_semester_id, status
      FROM registrations
      WHERE id = ${registrationId}
      FOR UPDATE
    `;
    const existing = rows[0];

    if (!existing) {
      throw new AppError("Không tìm thấy đăng ký học phần.", 404);
    }
    if (Number(existing.student_id) !== Number(studentId)) {
      throw new AppError("Bạn không có quyền huỷ đăng ký này.", 403);
    }
    if (existing.status !== "CONFIRMED") {
      throw new AppError("Đăng ký này đã được huỷ trước đó.", 409);
    }

    const registration = await tx.registration.update({
      where: { id: registrationId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    
    await tx.courseSemester.updateMany({
      where: { id: Number(existing.course_semester_id), registeredCount: { gt: 0 } },
      data: { registeredCount: { decrement: 1 } },
    });

    return registration;
  });
};

export const getMyRegistrations = async (studentId, status) => {
  return prisma.registration.findMany({
    where: {
      studentId,
      ...(status ? { status } : {}),
    },
    orderBy: { registeredAt: "desc" },
    include: {
      courseSemester: { include: { course: true, semester: true } },
    },
  });
};
