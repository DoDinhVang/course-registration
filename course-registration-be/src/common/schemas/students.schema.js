import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Mã sinh viên hoặc Email là bắt buộc")
    .trim(),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});
export const registerSchema = z.object({
  studentCode: z
    .string()
    .min(3, "Mã sinh viên tối thiểu 3 ký tự")
    .max(20, "Mã sinh viên tối đa 20 ký tự")
    .trim(),
  name: z.string().min(1, "Tên không được bỏ trống").max(150).trim(),
  email: z.string().email("Email không hợp lệ").max(150).trim(),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});