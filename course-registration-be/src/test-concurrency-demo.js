// Demo: nhiều sinh viên cùng bấm đăng ký 1 lớp học phần gần hết chỗ tại ĐÚNG 1
// node src/test-concurrency-demo.js [soLuongSinhVien] [capacityLopDemo]
// node src/test-concurrency-demo.js 100 10

import prisma from "./common/helpers/prisma.js";
import bcrypt from "bcryptjs";

const BASE_URL = "http://localhost:3000/api";
const NUM_STUDENTS = Number(process.argv[2]) || 30;
const CAPACITY = Number(process.argv[3]) || 5;
const DEMO_PASSWORD = "password123";

async function ensureServerIsRunning() {
  try {
    await fetch("http://localhost:3000/");
  } catch {
    console.error(
      `\nKhông kết nối được tới ${BASE_URL}.\nHãy mở 1 terminal khác, chạy "npm run dev" rồi thử lại.`,
    );
    process.exit(1);
  }
}

async function setupDemoData() {
  console.log(
    `\n=== CHUẨN BỊ DỮ LIỆU DEMO: 1 lớp học phần capacity=${CAPACITY}, ${NUM_STUDENTS} sinh viên ===`,
  );

  const suffix = Date.now();
  const course = await prisma.course.create({
    data: {
      code: `DEMO${suffix}`.slice(0, 20),
      name: "Lớp Demo Kiểm Thử Đồng Thời",
    },
  });
  const semester = await prisma.semester.create({
    data: { code: `DS${suffix}`.slice(0, 20), name: "Học kỳ Demo Concurrency" },
  });
  const courseSemester = await prisma.courseSemester.create({
    data: {
      courseId: course.id,
      semesterId: semester.id,
      capacity: CAPACITY,
      registeredCount: 0,
    },
  });

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const students = [];
  for (let i = 0; i < NUM_STUDENTS; i++) {
    const student = await prisma.student.create({
      data: {
        studentCode: `DEMO${suffix}${i}`.slice(0, 20),
        name: `Demo Student ${i + 1}`,
        email: `demo-${suffix}-${i}@example.com`,
        password: hashedPassword,
      },
    });
    students.push(student);
  }

  console.log(
    `Đã tạo: 1 học kỳ, 1 môn học, 1 lớp học phần (courseSemesterId=${courseSemester.id}, capacity=${CAPACITY}), ${students.length} sinh viên demo.`,
  );
  return { course, semester, courseSemester, students };
}

async function loginAll(students) {
  console.log(
    `Đang đăng nhập ${students.length} sinh viên demo để lấy access token...`,
  );

  // Đăng nhập cũng gọi DB (tìm student + ghi refreshToken) nên ở quy mô rất
  // lớn (vài trăm/nghìn request cùng lúc), bước NÀY có thể tự nó đã chạm giới
  // hạn connection pool trước khi kịp tới bước đăng ký — không coi là lỗi của
  // script, chỉ lọc bỏ những sinh viên login thất bại và báo cáo rõ số lượng.
  const results = await Promise.allSettled(
    students.map((s) =>
      fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: s.email, password: DEMO_PASSWORD }),
      }).then((res) => res.json()),
    ),
  );

  const tokens = [];
  let failed = 0;
  for (const r of results) {
    const token =
      r.status === "fulfilled" ? r.value?.data?.accessToken : undefined;
    if (token) {
      tokens.push(token);
    } else {
      failed++;
    }
  }

  if (failed > 0) {
    console.log(
      `  Lưu ý: ${failed}/${students.length} sinh viên đăng nhập thất bại. Ở quy mô rất lớn (hàng trăm/nghìn), bước ĐĂNG NHẬP có thể tự nghẽn vì bcrypt.compare() là CPU-bound (~65ms/lần trên 1 lõi) — không phải giới hạn connection pool tới DB. Đây là hiện tượng riêng của bước login, KHÔNG phản ánh khả năng chịu tải của bước đăng ký học phần (xem kết quả "KHÔNG OVERSELL" bên dưới). Chỉ ${tokens.length} sinh viên có token sẽ tham gia bước đăng ký tiếp theo.`,
    );
  }

  return tokens;
}

async function fireConcurrentRegistrations(tokens, courseSemesterId) {
  console.log(
    `\n=== ${tokens.length} SINH VIÊN CÙNG BẤM ĐĂNG KÝ 1 LỚP (capacity=${CAPACITY}) TẠI ĐÚNG 1 THỜI ĐIỂM ===`,
  );
  const start = performance.now();

  const results = await Promise.all(
    tokens.map((token) =>
      fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseSemesterIds: [courseSemesterId] }),
      }).then((res) => res.json()),
    ),
  );

  const elapsedMs = Math.round(performance.now() - start);

  const succeeded = results.filter((r) => r.data?.success?.length === 1);
  const rejectedFull = results.filter((r) =>
    r.data?.failed?.[0]?.message?.includes("hết chỗ"),
  );
  const otherFailures = results.filter(
    (r) =>
      r.data?.success?.length !== 1 &&
      !r.data?.failed?.[0]?.message?.includes("hết chỗ"),
  );

  console.log(`Hoàn tất trong ${elapsedMs}ms.`);
  console.log(`  Đăng ký thành công     : ${succeeded.length}`);
  console.log(`  Bị từ chối "hết chỗ"   : ${rejectedFull.length}`);
  if (otherFailures.length > 0) {
    console.log(`  Lỗi khác (không mong đợi): ${otherFailures.length}`);
    otherFailures.forEach((r) => console.log("    ", JSON.stringify(r)));
  }

  return { succeeded, rejectedFull, otherFailures };
}

async function verifyNoOversell(courseSemesterId) {
  const courseSemester = await prisma.courseSemester.findUnique({
    where: { id: courseSemesterId },
  });
  const confirmedCount = await prisma.registration.count({
    where: { courseSemesterId, status: "CONFIRMED" },
  });

  console.log(`\n=== ĐỐI CHIẾU DỮ LIỆU THẬT TRONG DATABASE ===`);
  console.log(
    `  capacity (giới hạn chỗ)                : ${courseSemester.capacity}`,
  );
  console.log(
    `  registeredCount (bộ đếm trong bảng)     : ${courseSemester.registeredCount}`,
  );
  console.log(`  Số dòng registrations CONFIRMED thực tế : ${confirmedCount}`);

  const ok =
    courseSemester.registeredCount === courseSemester.capacity &&
    confirmedCount === courseSemester.capacity &&
    courseSemester.registeredCount === confirmedCount;

  console.log(
    ok
      ? "\nKẾT QUẢ: KHÔNG OVERSELL — 3 con số trên khớp tuyệt đối."
      : "\nKẾT QUẢ: PHÁT HIỆN SAI LỆCH — xem lại register.service.js.",
  );
  return ok;
}

async function cleanup({ course, semester, courseSemester, students }) {
  await prisma.registration.deleteMany({
    where: { courseSemesterId: courseSemester.id },
  });
  await prisma.courseSemester.delete({ where: { id: courseSemester.id } });
  await prisma.course.delete({ where: { id: course.id } });
  await prisma.semester.delete({ where: { id: semester.id } });
  await prisma.refreshToken.deleteMany({
    where: { studentId: { in: students.map((s) => s.id) } },
  });
  await prisma.student.deleteMany({
    where: { id: { in: students.map((s) => s.id) } },
  });
  console.log("\nĐã dọn dẹp toàn bộ dữ liệu demo.");
}

async function main() {
  await ensureServerIsRunning();

  const demoData = await setupDemoData();
  try {
    const tokens = await loginAll(demoData.students);
    if (tokens.length === 0) {
      throw new Error(
        "Không sinh viên nào đăng nhập thành công — không thể tiếp tục demo.",
      );
    }
    await fireConcurrentRegistrations(tokens, demoData.courseSemester.id);
    const ok = await verifyNoOversell(demoData.courseSemester.id);
    process.exitCode = ok ? 0 : 1;
  } finally {
    await cleanup(demoData);
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error("Lỗi khi chạy demo:", error);
  await prisma.$disconnect();
  process.exit(1);
});
