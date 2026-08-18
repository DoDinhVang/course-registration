import prisma from "../common/helpers/prisma.js";

export const getSemesterList = async () => {
  const semesterList = await prisma.semester.findMany();
  return semesterList;
};

export const createSemester = async (data) => {
  const semester = await prisma.semester.create({
    data: {
      code: data.code,
      name: data.name,
    },
  });
};

export const getCoursesBySemesterId = async (semesterId) => {
  console.log("semesterId", semesterId);
  return await prisma.courseSemester.findMany({
    where: {
      semesterId: semesterId,
    },
    include: {
      course: true,
    },
  });
};

export const bulkAddCoursesToSemester = async (semesterId, courseIds) => {
  //Loại bỏ courseId trùng lặp trong chính request
  const uniqueCourseIds = [...new Set(courseIds)];
  const semester = await prisma.semester.findUnique({
    where: {
      id: semesterId,
    },
  });

  if (!semester) throw new ApiError(404, "Semester không tồn tại");

  const existingCourses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true },
  });

  const existingCourseIds = existingCourses.map((c) => c.id);

  const invalidCourseIds = uniqueCourseIds.filter(
    (id) => !existingCourseIds.includes(id),
  );

  if (invalidCourseIds.length > 0) {
    throw new ApiError(
      400,
      `Các courseId không tồn tại: ${invalidCourseIds.join(", ")}`,
    );
  }

  const data = existingCourseIds.map((courseId) => ({ courseId, semesterId }));

  const result = await prisma.courseSemester.createMany({
    data: data,
  });

  return {
    requested: courseIds.length,
    inserted: result.count, // số bản ghi thực sự được thêm (đã trừ trùng)
    skipped: existingCourseIds.length - result.count, // bị bỏ qua vì đã tồn tại từ trước
  };
};
