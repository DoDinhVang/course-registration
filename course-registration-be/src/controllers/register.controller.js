import * as registerService from "../services/register.service.js";
export const register = async (req, res, next) => {
  try {
    const { courseIds } = req.body;
    const student = req.user;
    const result = registerService.register(student.id, courseIds);
    res.status(201).json({
      success: true,
      message: "Đăng ký môn học thành công",
    });
  } catch (error) {
    next(error);
  }
};
