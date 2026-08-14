import prisma from "../src/common/helpers/prisma.js";
import bcrypt from "bcryptjs";

//Mẫu danh sách các học phần
const courses = [
  { code: "BAS1150", name: "Triết học Mác Lênin" },
  { code: "BAS1201", name: "Đại số" },
  { code: "BAS1203", name: "Giải tích 1" },
  { code: "INT1154", name: "Tin học cơ sở 1" },
  { code: "BAS1226", name: "Xác suất thống kê" },
  { code: "BAS1151", name: "Kinh tế chính trị Mác Lênin" },
  { code: "BAS1204", name: "Giải tích 2" },
  { code: "BAS1224", name: "Vật lý 1 và thí nghiệm" },
  { code: "INT1155", name: "Tin học cơ sở 2" },
  { code: "ELE1433", name: "Kỹ thuật số" },
  { code: "BAS1152", name: "Chủ nghĩa xã hội khoa học" },
  { code: "INT1358", name: "Toán rời rạc 1" },
  { code: "INT1339", name: "Ngôn ngữ lập trình C++" },
  { code: "ELE1330", name: "Xử lý tín hiệu số" },
  { code: "BAS1122", name: "Tư tưởng Hồ Chí Minh" },
  { code: "INT13145", name: "Kiến trúc máy tính" },
  { code: "INT1359", name: "Toán rời rạc 2" },
  { code: "INT1306", name: "Cấu trúc dữ liệu và giải thuật" },
  { code: "ELE1319", name: "Lý thuyết thông tin" },
  { code: "INT1319", name: "Hệ điều hành" },
  { code: "INT1332", name: "Lập trình hướng đối tượng" },
  { code: "INT1313", name: "Cơ sở dữ liệu" },
  { code: "INT1336", name: "Mạng máy tính" },
  { code: "INT13162", name: "Lập trình với Python" },
  { code: "INT1341", name: "Nhập môn trí tuệ nhân tạo" },
  { code: "INT1340", name: "Nhập môn công nghệ phần mềm" },
  {
    code: "INT1303",
    name: "An toàn và bảo mật hệ thống thông tin",
  },
  { code: "INT1434", name: "Lập trình web" },
  { code: "INT14148", name: "Cơ sở dữ liệu phân tán" },
  {
    code: "INT1342",
    name: "Phân tích và thiết kế hệ thống thông tin",
  },
];

// Mẫu Danh sách Sinh viên
const students = [
  {
    studentCode: "SV001",
    name: "Nguyen Van A",
    email: "sv001@example.com",
    password: "password123",
    status: "ACTIVE",
  },
  {
    studentCode: "SV002",
    name: "Tran Thi B",
    email: "sv002@example.com",
    password: "password123",
    status: "ACTIVE",
  },
  {
    studentCode: "SV003",
    name: "Le Van C",
    email: "sv003@example.com",
    password: "password123",
    status: "LOCKED", // Để kiểm thử case tài khoản bị khóa
  },
];

async function seedStudents(clean = false) {
  if (clean) {
    await prisma.refreshToken.deleteMany({});
    await prisma.student.deleteMany({});
  }

  const salt = await bcrypt.genSalt(10);

  for (const s of students) {
    const hashedPassword = await bcrypt.hash(s.password, salt);
    await prisma.student.upsert({
      where: { studentCode: s.studentCode },
      update: {
        name: s.name,
        email: s.email,
        status: s.status,
      },
      create: {
        studentCode: s.studentCode,
        name: s.name,
        email: s.email,
        password: hashedPassword,
        status: s.status,
      },
    });
  }
}

async function seedCourses(clean = false) {
  if (clean) {
    await prisma.course.deleteMany({});
  }
  for (const course of courses) {
    await prisma.course.upsert({
      where: { code: course.code },
      update: {
        name: course.name,
      },
      create: {
        code: course.code,
        name: course.name,
      },
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const clean = args.includes("--clean");

  await seedStudents(clean);
  await seedCourses(clean);
}

main()
  .catch((e) => {
    console.error("Lỗi trong quá trình seed dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
