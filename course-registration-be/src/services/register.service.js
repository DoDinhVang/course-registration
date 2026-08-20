import prisma from "../common/helpers/prisma.js";
import { AppError } from "../common/middlware/error.middleware.js";

const MAX_TX_RETRIES = 5;

// Dưới tải đồng thời cao (nhiều sinh viên cùng INSERT vào bảng registrations
// cho cùng 1 lớp học phần), MySQL/InnoDB có thể tự phát hiện deadlock thật sự
// (do gap lock của SELECT ... FOR UPDATE trên các dòng chưa tồn tại) hoặc
// Prisma tự phát hiện write-conflict và chủ động abort 1 trong các transaction
// xung đột (đây là hành vi ĐÚNG và ĐƯỢC MONG ĐỢI của DB, không phải bug).
// Cách xử lý chuẩn là bắt lỗi này và tự động thử lại transaction, KHÔNG retry
// với các lỗi nghiệp vụ (AppError như "hết chỗ", "đã đăng ký rồi").
const isRetryableTxError = (error) => {
  if (error.code === "P2034") return true; // Prisma: write conflict/deadlock
  const msg = String(error.message || "");
  return /deadlock/i.test(msg) || /write conflict/i.test(msg);
};

const runInTransaction = async (fn) => {
  let lastError;
  for (let attempt = 0; attempt < MAX_TX_RETRIES; attempt++) {
    try {
      // ReadCommitted thay vì RepeatableRead (mặc định của MySQL) vì luồng
      // đăng ký chỉ INSERT/UPDATE dựa trên dữ liệu MỚI NHẤT đọc được ngay
      // trong transaction (không dựa vào snapshot cũ), nên không cần
      // RepeatableRead; đổi lại ReadCommitted dùng record lock thay vì
      // next-key/gap lock nên giảm mạnh tần suất deadlock khi nhiều
      // transaction cùng insert các khoá (student_id, course_semester_id)
      // gần nhau trên cùng 1 lớp học phần.
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

// Đăng ký 1 lớp học phần (courseSemester) cho 1 sinh viên.
// Toàn bộ thao tác chạy trong 1 transaction để đảm bảo tính đúng đắn khi có
// nhiều sinh viên cùng đăng ký 1 lớp trong cùng thời điểm (xem giải thích chi tiết
// trong tài liệu đặc tả đính kèm).
const registerSingleCourse = async (studentId, courseSemesterId) => {
  return runInTransaction(async (tx) => {
    // 1. Khoá (lock) dòng đăng ký của chính sinh viên này với lớp học phần này (nếu có).
    //    Dùng SELECT ... FOR UPDATE để 2 request trùng nhau (double-click, retry...)
    //    của CÙNG 1 sinh viên trên CÙNG 1 lớp phải xếp hàng xử lý tuần tự,
    //    tránh vừa cộng 2 lần chỗ trống vừa tạo/ cập nhật đăng ký 2 lần.
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

    // 2. Giữ chỗ 1 cách nguyên tử (atomic compare-and-swap ngay trong SQL):
    //    so sánh registered_count < capacity NGAY TRONG WHERE của chính câu
    //    UPDATE, không đọc capacity ra trước rồi mới so sánh ở tầng ứng dụng.
    //    Nếu tách thành 2 bước (SELECT capacity rồi UPDATE ... WHERE
    //    registeredCount < <giá trị đã đọc>), dưới REPEATABLE READ của MySQL,
    //    giá trị đọc trước đó là 1 snapshot; khi nhiều transaction cùng dựa
    //    trên snapshot đó để UPDATE, MySQL/Prisma sẽ phát hiện write conflict
    //    và văng lỗi "Transaction failed due to a write conflict or a
    //    deadlock" hàng loạt khi tải đồng thời cao (đã kiểm chứng thực tế).
    //    Gộp thành 1 câu UPDATE duy nhất loại bỏ hoàn toàn nguy cơ này vì
    //    MySQL luôn khoá và đánh giá điều kiện trên dữ liệu mới nhất của dòng.
    const seatReserved = await tx.$executeRaw`
      UPDATE course_semesters
      SET registered_count = registered_count + 1
      WHERE id = ${courseSemesterId} AND registered_count < capacity
    `;
    if (seatReserved === 0) {
      // Không tăng được: hoặc lớp không tồn tại, hoặc đã hết chỗ. Đọc thêm
      // 1 lần (không cần atomic) chỉ để trả về thông báo lỗi rõ ràng.
      const courseSemester = await tx.courseSemester.findUnique({
        where: { id: courseSemesterId },
        select: { id: true },
      });
      if (!courseSemester) {
        throw new AppError("Lớp học phần không tồn tại.", 404);
      }
      throw new AppError("Lớp học phần đã hết chỗ.", 409);
    }

    // 3. Ghi nhận đăng ký. Nếu sinh viên từng đăng ký rồi huỷ trước đó thì cập
    //    nhật lại bản ghi cũ (giữ lịch sử, tránh vi phạm unique constraint
    //    [studentId, courseSemesterId]); nếu chưa từng đăng ký thì tạo mới.
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
      // Lưới an toàn dự phòng: nếu vì lý do gì đó vẫn đụng unique constraint
      // (P2002), trả về lỗi rõ ràng thay vì lỗi 500 khó hiểu. Transaction sẽ
      // tự rollback nên phần giữ chỗ ở bước 3 cũng được hoàn tác.
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
  // Xử lý tuần tự từng lớp trong 1 request để không chiếm nhiều connection
  // cùng lúc (connection pool có hạn) khi hệ thống đang phải phục vụ rất
  // nhiều sinh viên đăng ký song song trong khoảng thời gian mở đăng ký.
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
    // Khoá đúng dòng đăng ký trước, cùng thứ tự khoá (registrations trước,
    // course_semesters sau) như luồng register() để tránh deadlock giữa 2
    // luồng đăng ký / huỷ chạy song song.
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

    // Trả lại chỗ trống cho lớp học phần. Guard registeredCount > 0 để không
    // bao giờ bị âm dù có xảy ra bất thường nào đó.
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
