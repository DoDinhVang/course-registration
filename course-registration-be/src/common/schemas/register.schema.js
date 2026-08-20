import { z } from "zod";

export const registerCourseSchema = z.object({
  courseSemesterIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Vui lòng chọn ít nhất 1 học phần để đăng ký.")
    .max(20, "Chỉ được đăng ký tối đa 20 học phần trong 1 lần."),
});
