import { StatusCodes } from "http-status-codes";
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware xử lý lỗi tập trung
export const errorHandler = (err, req, res, next) => {
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  const responseError = {
    statusCode: err.statusCode,
    message: err.message || StatusCodes[err.statusCode], // Nếu lỗi mà không có message thì lấy ReasonPhrases chuẩn theo mã Status Code
    stack: err.stack,
  };

  // Chỉ khi môi trường là DEV thì mới trả về Stack Trace để debug dễ dàng hơn, còn không thì xóa đi.
  // if (en.BUILD_MODE === "dev") {
  //   delete responseError.stack;
  // }

  // Đoạn này có thể mở rộng nhiều về sau như ghi Error Log vào file, bắn thông báo lỗi vào group Slack, Telegram, Email...vv Hoặc có thể viết riêng Code ra một file Middleware khác tùy dự án.
  // ...

  // Trả responseError về phía Front-end
  res.status(responseError.statusCode).json(responseError);
};
