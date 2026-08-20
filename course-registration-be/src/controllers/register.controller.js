import * as registerService from "../services/register.service.js";
import { registerCourseSchema } from "../common/schemas/register.schema.js";
import { AppError } from "../common/middlware/error.middleware.js";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "WAITLISTED", "CANCELLED", "FAILED"];

export const register = async (req, res, next) => {
  try {
    const { data, success, error } = registerCourseSchema.safeParse(req.body);
    if (!success) {
      throw new AppError(error.issues[0]?.message || "Dữ liệu không hợp lệ.", 400);
    }

    const result = await registerService.register(req.user.id, data.courseSemesterIds);

    res.status(200).json({
      success: true,
      message:
        result.failed.length === 0
          ? "Đăng ký học phần thành công."
          : "Một số học phần đăng ký không thành công.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const registrationId = Number(req.params.id);
    if (!Number.isInteger(registrationId) || registrationId <= 0) {
      throw new AppError("ID đăng ký không hợp lệ.", 400);
    }

    const registration = await registerService.cancelRegistration(
      req.user.id,
      registrationId,
    );

    res.status(200).json({
      success: true,
      message: "Huỷ đăng ký học phần thành công.",
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRegistrations = async (req, res, next) => {
  try {
    const status = req.query.status;
    if (status && !VALID_STATUSES.includes(status)) {
      throw new AppError("status không hợp lệ.", 400);
    }

    const registrations = await registerService.getMyRegistrations(req.user.id, status);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách đăng ký thành công.",
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};
