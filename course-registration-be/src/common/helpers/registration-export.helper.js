import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  AlignmentType,
} from "docx";

const INK = "1C2333";
const MUTED = "5B6472";
const ACCENT = "1F4E8C";
const LINE = "D8D2C0";

const STATUS_LABEL = {
  PENDING: "Đang xử lý",
  CONFIRMED: "Đã xác nhận",
  WAITLISTED: "Danh sách chờ",
  CANCELLED: "Đã huỷ",
  FAILED: "Thất bại",
};

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: LINE },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
  left: { style: BorderStyle.SINGLE, size: 4, color: LINE },
  right: { style: BorderStyle.SINGLE, size: 4, color: LINE },
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const headerCell = (text) =>
  new TableCell({
    shading: { type: ShadingType.CLEAR, fill: ACCENT },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20, font: "Calibri" })],
      }),
    ],
  });

const bodyCell = (text, { align = AlignmentType.LEFT, shade = "FFFFFF", bold = false, color = INK } = {}) =>
  new TableCell({
    shading: { type: ShadingType.CLEAR, fill: shade },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text: String(text), size: 20, color, font: "Calibri", bold })],
      }),
    ],
  });

const infoLine = (label, value) =>
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 21, color: MUTED, font: "Calibri" }),
      new TextRun({ text: value, size: 21, color: INK, font: "Calibri" }),
    ],
  });

// Sinh ra buffer file .docx liệt kê danh sách học phần sinh viên đã đăng ký,
// dùng làm "phiếu đăng ký học phần" để sinh viên tải về/in ra.
export const buildRegistrationsDocx = (student, registrations) => {
  const rows = registrations.map((reg, index) =>
    new TableRow({
      children: [
        bodyCell(index + 1, { align: AlignmentType.CENTER, shade: index % 2 === 0 ? "FFFFFF" : "FAF8F3" }),
        bodyCell(reg.courseSemester.course.code, { shade: index % 2 === 0 ? "FFFFFF" : "FAF8F3", bold: true }),
        bodyCell(reg.courseSemester.course.name, { shade: index % 2 === 0 ? "FFFFFF" : "FAF8F3" }),
        bodyCell(reg.courseSemester.semester.name, { shade: index % 2 === 0 ? "FFFFFF" : "FAF8F3" }),
        bodyCell(STATUS_LABEL[reg.status] || reg.status, {
          align: AlignmentType.CENTER,
          shade: index % 2 === 0 ? "FFFFFF" : "FAF8F3",
          color: reg.status === "CONFIRMED" ? "2A6B45" : reg.status === "CANCELLED" ? "9A2E24" : INK,
          bold: true,
        }),
        bodyCell(formatDate(reg.registeredAt), { align: AlignmentType.CENTER, shade: index % 2 === 0 ? "FFFFFF" : "FAF8F3" }),
      ],
    }),
  );

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [6, 14, 34, 20, 14, 12],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell("STT"),
          headerCell("Mã môn"),
          headerCell("Tên môn học"),
          headerCell("Học kỳ"),
          headerCell("Trạng thái"),
          headerCell("Ngày đăng ký"),
        ],
      }),
      ...rows,
    ],
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22, color: INK } } } },
    sections: [
      {
        properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } },
        children: [
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: "PHIẾU ĐĂNG KÝ HỌC PHẦN", bold: true, size: 34, color: ACCENT, font: "Calibri" })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 8 } },
            children: [
              new TextRun({
                text: `Xuất lúc: ${new Date().toLocaleString("vi-VN")}`,
                italics: true,
                size: 19,
                color: MUTED,
                font: "Calibri",
              }),
            ],
          }),
          infoLine("Họ và tên", student.name),
          infoLine("Mã sinh viên", student.studentCode),
          infoLine("Email", student.email),
          new Paragraph({ spacing: { after: 200 } }),
          registrations.length > 0
            ? table
            : new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({ text: "Chưa có học phần nào được đăng ký.", italics: true, size: 22, color: MUTED, font: "Calibri" })],
              }),
          new Paragraph({
            spacing: { before: 240 },
            children: [
              new TextRun({ text: `Tổng số: ${registrations.length} học phần.`, bold: true, size: 21, color: INK, font: "Calibri" }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
};
