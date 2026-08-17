import { z } from "zod";

export const createSemesterSchema = z.object({
  code: z.string().min(1, "Code là bắt buộc").trim(),
  name: z.string().min(1, "Mật khẩu là bắt buộc").trim(),
});
