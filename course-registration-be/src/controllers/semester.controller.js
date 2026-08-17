import { json, success } from "zod";
import * as semesterService from "../services/semester.service.js";
import { createSemesterSchema } from "../common/schemas/semester.schema.js";
export const getSemesterList = async (rq, res, next) => {
  try {
    const semeterList = await semesterService.getSemesterList();
    return res.status(200).json({
      success: 200,
      message: "Lấy thành công",
      data: semeterList,
    });
  } catch (error) {
    next(error);
  }
};
export const createSemester = async (req, res, next) => {
  try {
    const { data, success } = createSemesterSchema.safeParse(req.body);
    console.log("data", req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const semester = await semesterService.createSemester(data);
    return res.status(200).json({
      success: 201,
      message: "Tạo thành công",
      data: semester,
    });
  } catch (error) {
    next(error);
  }
};
