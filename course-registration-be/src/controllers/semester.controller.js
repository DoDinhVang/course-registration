import { json, success } from "zod";
import * as semesterService from "../services/semester.service.js";
import { createSemesterSchema } from "../common/schemas/semester.schema.js";
export const getSemesterList = async (rq, res, next) => {
  try {
    const semeterList = await semesterService.getSemesterList();
    res.status(200).json({
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
    if (!success) {
      res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
      });
    }
    const semester = await semesterService.createSemester(data);
    res.status(200).json({
      success: 201,
      message: "Tạo thành công",
      data: semester,
    });
  } catch (error) {
    next(error);
  }
};

export const getCoursesBySemesterId = async (req, res, next) => {
  try {
    const { semesterId } = req.params;
    const courseList = await semesterService.getCoursesBySemesterId(
      Number(semesterId),
    );
    res.status(200).json({
      success: true,
      message: "Lấy danh sách học phần thành công",
      data: courseList,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkAddCoursesToSemester = async (req, res, next) => {
  try {
    const { semesterId } = req.params;
    const { courseIds } = req.body;
    const result = await semesterService.bulkAddCoursesToSemester(
      Number(semesterId),
      courseIds,
    );
    res.status(201).json({
      success: true,
      message: "Thêm học phần thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
