import prisma from "../common/helpers/prisma.js";

export const getSemesterList = async () => {
  const semesterList = await prisma.semester.findMany();
  return semesterList;
};

export const createSemester = async (data) => {
  console.log("111111111", data);
  const semester = await prisma.semester.create({
    data: {
      code: data.code,
      name: data.name,
    },
  });
};
