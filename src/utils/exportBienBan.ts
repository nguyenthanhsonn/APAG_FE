import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeightRule,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';

export interface BienBanStudentRow {
  stt: number;
  maSV: string;
  hoTen: string;
  ngaySinh: string;
  drlSV: number;
  drlLop: number;
  xepLoai: string;
  bieuQuyet: string;
  ghiChu: string;
}

export interface BienBanFormData {
  khoa: string;
  lop: string;
  diaDanh?: string;
  ngayHop: string; // dd/MM/yyyy
  thang: string;
  nam: string;
  hocKy: string;
  namHoc: string;
  gioKhoi: string;
  gioKetThuc: string;
  diaDiem: string;
  tongSoDuHop: string;
  soVang: string;
  lyDoVang: string;
  chuToa: string;
  thuKy: string;
  tenLopTruong: string;
  students: BienBanStudentRow[];
}

function getClassificaionCounts(students: BienBanStudentRow[]) {
  return {
    xuatSac: students.filter((s) => s.xepLoai === 'Xuất sắc').length,
    tot: students.filter((s) => s.xepLoai === 'Tốt').length,
    kha: students.filter((s) => s.xepLoai === 'Khá').length,
    trungBinh: students.filter((s) => s.xepLoai === 'Trung bình').length,
    yeu: students.filter((s) => s.xepLoai === 'Yếu').length,
  };
}

function txt(text: string, bold = false, size = 24, italic = false, underline = false): TextRun {
  return new TextRun({
    text,
    bold,
    size,
    italics: italic,
    font: 'Times New Roman',
    underline: underline ? { type: 'single' } : undefined,
  });
}

function para(
  runs: TextRun[],
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
  spacingBefore = 0,
  spacingAfter = 80,
  indent?: { left?: number; firstLine?: number },
): Paragraph {
  return new Paragraph({
    children: runs,
    alignment,
    spacing: { before: spacingBefore, after: spacingAfter, line: 276 },
    indent: indent ? { left: indent.left, firstLine: indent.firstLine } : undefined,
  });
}

function cell(text: string, bold = false, colSpan = 1, width?: number): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [txt(text, bold, 20)], alignment: AlignmentType.CENTER })],
    columnSpan: colSpan,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

export async function exportBienBanDocx(data: BienBanFormData) {
  const counts = getClassificaionCounts(data.students);

  // ── Header table (KHOA/LOP trái | ĐẢNG phải) ──
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              para([txt('HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG', true, 22)]),
              para([txt('PHÂN HIỆU HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG TẠI THÀNH PHỐ ĐÀ NẴNG', true, 20)]),
              para([txt(`KHOA: ${data.khoa}`, true, 22)]),
              para([txt(`LỚP: ${data.lop}`, true, 22)]),
              para([txt('*', true, 22)], AlignmentType.CENTER),
            ],
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
          new TableCell({
            children: [
              para([txt('Phụ lục 01', false, 22, true)], AlignmentType.RIGHT),
              para([txt('ĐẢNG CỘNG SẢN VIỆT NAM', true, 22, false, true)], AlignmentType.RIGHT),
            ],
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
        ],
      }),
    ],
  });

  // ── Student data table ──
  const headerRow = new TableRow({
    tableHeader: true,
    height: { value: convertInchesToTwip(0.4), rule: HeightRule.ATLEAST },
    children: [
      cell('STT', true, 1, 400),
      cell('Mã số SV', true, 1, 900),
      cell('Họ và Tên', true, 1, 1800),
      cell('Ngày sinh', true, 1, 800),
      cell('ĐRL SV tự đánh giá', true, 1, 900),
      cell('ĐRL lớp đánh giá', true, 1, 900),
      cell('Xếp loại', true, 1, 700),
      cell('Biểu quyết', true, 1, 700),
      cell('Ghi chú', true, 1, 1200),
    ],
  });

  const dataRows = data.students.map(
    (s) =>
      new TableRow({
        children: [
          cell(String(s.stt)),
          cell(s.maSV),
          cell(s.hoTen),
          cell(s.ngaySinh),
          cell(s.drlSV > 0 ? String(s.drlSV) : ''),
          cell(s.drlLop > 0 ? String(s.drlLop) : ''),
          cell(s.xepLoai),
          cell(s.bieuQuyet),
          cell(s.ghiChu),
        ],
      }),
  );

  const studentTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  // ── Signature table ──
  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              para([txt('CỐ VẤN HỌC TẬP', true)], AlignmentType.CENTER),
              para([txt('(Ký và ghi rõ họ tên)', false, 22, true)], AlignmentType.CENTER),
            ],
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
          new TableCell({
            children: [
              para([txt('LỚP TRƯỞNG', true)], AlignmentType.CENTER),
              para([txt('(Ký và ghi rõ họ tên)', false, 22, true)], AlignmentType.CENTER),
            ],
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
          new TableCell({
            children: [
              para([txt('THƯ KÝ', true)], AlignmentType.CENTER),
              para([txt('(Ký và ghi rõ họ tên)', false, 22, true)], AlignmentType.CENTER),
            ],
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
        ],
      }),
      new TableRow({
        height: { value: convertInchesToTwip(1.2), rule: HeightRule.ATLEAST },
        children: [
          new TableCell({ children: [para([txt(data.chuToa)], AlignmentType.CENTER)], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
          new TableCell({ children: [para([txt(data.tenLopTruong)], AlignmentType.CENTER)], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
          new TableCell({ children: [para([txt(data.thuKy)], AlignmentType.CENTER)], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) },
            margin: {
              top: convertInchesToTwip(0.79),
              bottom: convertInchesToTwip(0.79),
              left: convertInchesToTwip(1.18),
              right: convertInchesToTwip(0.79),
            },
          },
        },
        children: [
          headerTable,
          para([]),
          // Dòng ngày tháng — căn phải, in nghiêng
          para(
            [txt(`${data.diaDanh || 'Đà Nẵng'}, ngày ${data.ngayHop} tháng ${data.thang} năm ${data.nam}`, false, 24, true)],
            AlignmentType.RIGHT,
            0,
            160,
          ),
          // Tiêu đề
          para([txt(`BIÊN BẢN HỌP LỚP ${data.lop}`, true, 26)], AlignmentType.CENTER, 160, 80),
          para(
            [txt(`Về việc đánh giá kết quả rèn luyện học kỳ ${data.hocKy} năm học: ${data.namHoc}`, false, 24, true)],
            AlignmentType.CENTER,
            0,
            200,
          ),
          // I–III
          para([txt(`I. Thời gian: Cuộc họp bắt đầu vào hồi: ${data.gioKhoi} ngày: ${data.ngayHop}/${data.thang}/${data.nam}`, false)]),
          para([txt(`II. Địa điểm: ${data.diaDiem}`, false)]),
          para([txt('III. Thành phần:', false)]),
          para(
            [txt('Cố vấn học tập lớp, BCS lớp, BCH chi đoàn, toàn thể sinh viên trong lớp', false)],
            AlignmentType.LEFT,
            0,
            80,
            { left: convertInchesToTwip(0.3) },
          ),
          para([txt(`Tổng số người dự họp: ${data.tongSoDuHop} người`, false)]),
          para([txt(`Vắng họp: ${data.soVang} người, lý do vắng họp: ${data.lyDoVang}`, false)]),
          para([txt(`Chủ tọa: ${data.chuToa}`, false)]),
          para([txt(`Thư ký: ${data.thuKy}`, false)]),
          para([txt(`Lớp trưởng: ${data.tenLopTruong}`, false)]),
          para([]),
          para([txt('IV. Nội dung', false)]),
          para(
            [txt('1. Lớp trưởng báo cáo kết quả tổng hợp phiếu đánh giá kết quả rèn luyện của sinh viên trong lớp', false)],
            AlignmentType.LEFT,
            0,
            80,
            { left: convertInchesToTwip(0.3) },
          ),
          para(
            [txt('2. CVHT lớp triển khai các văn bản hướng dẫn đánh giá kết quả rèn luyện, căn cứ vào báo cáo của Ban cán sự lớp triển khai các bước trong quy trình đánh giá kết quả rèn luyện của sinh viên trong lớp.', false)],
            AlignmentType.LEFT,
            0,
            80,
            { left: convertInchesToTwip(0.3) },
          ),
          para(
            [txt('3. Kết quả rèn luyện của các thành viên trong lớp:', false)],
            AlignmentType.LEFT,
            0,
            80,
            { left: convertInchesToTwip(0.3) },
          ),
          para(
            [txt('Căn cứ phiếu tự đánh giá kết quả rèn luyện của các thành viên trong lớp, ý kiến nhận xét, đánh giá của CVHT lớp, BCS lớp, BCH chi đoàn, BCH chi hội (nếu có), Tổ trưởng các tổ; đối chiếu với quy chế của Bộ Giáo dục và Đào tạo và quy định của Học viện, tập thể lớp nhất trí thông qua kết quả rèn luyện của các thành viên trong lớp như sau:', false)],
            AlignmentType.LEFT,
            0,
            160,
            { left: convertInchesToTwip(0.3) },
          ),
          studentTable,
          para([]),
          para([txt(`- Tổng số: ${data.students.length} sinh viên`, false)], AlignmentType.LEFT, 80, 40, { left: convertInchesToTwip(0.4) }),
          para([txt('Trong đó:', false)], AlignmentType.LEFT, 0, 40, { left: convertInchesToTwip(0.6) }),
          para([txt(`+ Xuất sắc: ${counts.xuatSac} Sinh viên`, false)], AlignmentType.LEFT, 0, 40, { left: convertInchesToTwip(0.8) }),
          para([txt(`+ Tốt:         ${counts.tot} Sinh viên`, false)], AlignmentType.LEFT, 0, 40, { left: convertInchesToTwip(0.8) }),
          para([txt(`+ Khá:         ${counts.kha} Sinh viên`, false)], AlignmentType.LEFT, 0, 40, { left: convertInchesToTwip(0.8) }),
          para([txt(`+ Trung bình:  ${counts.trungBinh} Sinh viên`, false)], AlignmentType.LEFT, 0, 40, { left: convertInchesToTwip(0.8) }),
          para([txt(`+ Yếu:         ${counts.yeu} Sinh viên`, false)], AlignmentType.LEFT, 0, 120, { left: convertInchesToTwip(0.8) }),
          para(
            [txt('Cuộc họp kết thúc vào hồi.........giờ..........phút, ngày.......tháng.... năm', false)],
            AlignmentType.LEFT,
            0,
            200,
            { left: convertInchesToTwip(0.3) },
          ),
          sigTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `BienBan_HopLop_${data.lop.replace(/\s+/g, '_')}.docx`);
}
