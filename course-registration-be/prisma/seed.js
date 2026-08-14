import prisma from "../src/common/helpers/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("=== Seed script started ===");

  // Delete existing data to avoid conflicts on duplicate runs
  await prisma.refreshToken.deleteMany({});
  await prisma.student.deleteMany({});

  // Hash default password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("123456", salt);

  // Create active student Nguyen Van A
  const student = await prisma.student.create({
    data: {
      studentCode: "SV001",
      name: "Nguyen Van A",
      email: "sv001@example.com",
      password: hashedPassword,
      status: "ACTIVE",
    },
  });

  console.log("Successfully seeded test student:");
  console.log(`- Code: ${student.studentCode}`);
  console.log(`- Name: ${student.name}`);
  console.log(`- Email: ${student.email}`);
  console.log(`- Password: 123456 (hashed in database)`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
