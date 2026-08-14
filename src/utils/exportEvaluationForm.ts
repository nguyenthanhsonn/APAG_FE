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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface EvaluationExportData {
  studentInfo: {
    fullName: string;
    studentCode: string;
    dateOfBirth?: string;
    className: string;
    facultyName?: string;
    majorName?: string;
    semester: string;
    academicYear: string;
  };
  scores: {
    sec1: { sv: number; class: number };
    sec2: { sv: number; class: number };
    sec3: { sv: number; class: number };
    sec4: { sv: number; class: number };
    sec5: { sv: number; class: number };
    totalSv: number;
    totalClass: number;
    ratingSv: string;
    ratingClass: string;
  };
}

function txt(text: string, bold = false, size = 22, italic = false, underline = false): TextRun {
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
  spacingAfter = 60,
  indent?: { left?: number; firstLine?: number },
): Paragraph {
  return new Paragraph({
    children: runs,
    alignment,
    spacing: { before: spacingBefore, after: spacingAfter, line: 276 },
    indent: indent ? { left: indent.left, firstLine: indent.firstLine } : undefined,
  });
}

function cell(
  text: string,
  bold = false,
  colSpan = 1,
  width?: number,
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER,
): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [txt(text, bold, 20)], alignment: align })],
    columnSpan: colSpan,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

const NO_TABLE_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const NO_CELL_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

/**
 * Xuất Phiếu đánh giá rèn luyện ra file Word (.docx)
 */
export async function exportEvaluationFormDocx(data: EvaluationExportData) {
  const { studentInfo, scores } = data;

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              para([txt('HỌC VIỆN HÀNH CHÍNH', false, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('VÀ QUẢN TRỊ CÔNG', false, 20)], AlignmentType.CENTER, 0, 20),
              para([txt('PHÂN HIỆU HỌC VIỆN', true, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG', true, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('TẠI THÀNH PHỐ ĐÀ NẴNG', true, 20)], AlignmentType.CENTER, 0, 10),
              para([txt('*', true, 20)], AlignmentType.CENTER, 0, 40),
            ],
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
          new TableCell({
            children: [
              para([txt('Phụ lục 01', false, 20, true)], AlignmentType.RIGHT),
              para([txt('ĐẢNG CỘNG SẢN VIỆT NAM', true, 20, false, true)], AlignmentType.RIGHT),
            ],
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
        ],
      }),
    ],
  });

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        height: { value: convertInchesToTwip(0.35), rule: HeightRule.ATLEAST },
        children: [
          cell('TT', true, 1, 500),
          cell('Nội dung đánh giá', true, 1, 4500, AlignmentType.LEFT),
          cell('Điểm tối đa', true, 1, 1000),
          cell('SV tự đánh giá', true, 1, 1200),
          cell('Lớp đánh giá', true, 1, 1200),
        ],
      }),
      new TableRow({
        children: [
          cell('I', true, 1, 500),
          cell('Ý thức tham gia học tập', true, 1, 4500, AlignmentType.LEFT),
          cell('20', true, 1, 1000),
          cell(String(scores.sec1.sv), false, 1, 1200),
          cell(String(scores.sec1.class), false, 1, 1200),
        ],
      }),
      new TableRow({
        children: [
          cell('II', true, 1, 500),
          cell('Ý thức chấp hành nội quy, quy chế, quy định trong Học viện', true, 1, 4500, AlignmentType.LEFT),
          cell('25', true, 1, 1000),
          cell(String(scores.sec2.sv), false, 1, 1200),
          cell(String(scores.sec2.class), false, 1, 1200),
        ],
      }),
      new TableRow({
        children: [
          cell('III', true, 1, 500),
          cell('Ý thức tham gia các hoạt động chính trị, xã hội, văn hóa, văn nghệ...', true, 1, 4500, AlignmentType.LEFT),
          cell('20', true, 1, 1000),
          cell(String(scores.sec3.sv), false, 1, 1200),
          cell(String(scores.sec3.class), false, 1, 1200),
        ],
      }),
      new TableRow({
        children: [
          cell('IV', true, 1, 500),
          cell('Ý thức công dân trong quan hệ cộng đồng', true, 1, 4500, AlignmentType.LEFT),
          cell('25', true, 1, 1000),
          cell(String(scores.sec4.sv), false, 1, 1200),
          cell(String(scores.sec4.class), false, 1, 1200),
        ],
      }),
      new TableRow({
        children: [
          cell('V', true, 1, 500),
          cell('Ý thức và kết quả tham gia phụ trách lớp, đoàn thể, tổ chức trong Học viện', true, 1, 4500, AlignmentType.LEFT),
          cell('10', true, 1, 1000),
          cell(String(scores.sec5.sv), false, 1, 1200),
          cell(String(scores.sec5.class), false, 1, 1200),
        ],
      }),
      new TableRow({
        children: [
          cell('', true, 1, 500),
          cell('TỔNG CỘNG', true, 1, 4500, AlignmentType.LEFT),
          cell('100', true, 1, 1000),
          cell(String(scores.totalSv), true, 1, 1200),
          cell(String(scores.totalClass), true, 1, 1200),
        ],
      }),
      new TableRow({
        children: [
          cell('', true, 1, 500),
          cell('XẾP LOẠI RÈN LUYỆN', true, 1, 4500, AlignmentType.LEFT),
          cell('', false, 1, 1000),
          cell(scores.ratingSv || 'Chưa xếp loại', true, 1, 1200),
          cell(scores.ratingClass || 'Chưa xếp loại', true, 1, 1200),
        ],
      }),
    ],
  });

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              para([txt('LỚP TRƯỞNG', true, 22)], AlignmentType.CENTER),
              para([txt('(Ký và ghi rõ họ tên)', false, 20, true)], AlignmentType.CENTER),
              para([], AlignmentType.CENTER, 0, 500),
            ],
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
          new TableCell({
            children: [
              para([txt('Đà Nẵng, ngày...... tháng...... năm 20...', false, 20, true)], AlignmentType.CENTER),
              para([txt('SINH VIÊN TỰ ĐÁNH GIÁ', true, 22)], AlignmentType.CENTER),
              para([txt('(Ký và ghi rõ họ tên)', false, 20, true)], AlignmentType.CENTER),
              para([], AlignmentType.CENTER, 0, 500),
              para([txt(studentInfo.fullName, true, 22)], AlignmentType.CENTER),
            ],
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
            },
          },
        },
        children: [
          headerTable,
          para([], AlignmentType.CENTER, 0, 100),
          para([txt('PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN CỦA SINH VIÊN', true, 28)], AlignmentType.CENTER, 100, 40),
          para([txt('(Kèm theo Quyết định số 4185/QĐ-HCQG ngày 08 tháng 9 năm 2023)', false, 20, true)], AlignmentType.CENTER, 0, 60),
          para([txt(`Học kỳ: ${studentInfo.semester} - Năm học: ${studentInfo.academicYear}`, true, 22)], AlignmentType.CENTER, 0, 160),

          para([txt(`- Họ và tên sinh viên: `, true), txt(studentInfo.fullName)]),
          para([txt(`- Mã số sinh viên: `, true), txt(studentInfo.studentCode)]),
          para([txt(`- Ngày sinh: `, true), txt(studentInfo.dateOfBirth || '....................')]),
          para([txt(`- Lớp: `, true), txt(studentInfo.className), txt(`    - Khoa: `, true), txt(studentInfo.facultyName || '....................')]),
          para([txt(`- Ngành học: `, true), txt(studentInfo.majorName || '....................')]),
          para([], AlignmentType.LEFT, 0, 100),

          summaryTable,
          para([], AlignmentType.LEFT, 0, 200),
          sigTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (studentInfo.studentCode || 'PhieuDanhGia').replace(/\s+/g, '_');
  saveAs(blob, `PhieuDanhGia_${safeName}.docx`);
}

/**
 * Xuất Phiếu đánh giá rèn luyện ra file Excel (.xlsx)
 */
export function exportEvaluationFormExcel(data: EvaluationExportData) {
  const { studentInfo, scores } = data;
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    ['HỌC VIỆN HÀNH CHÍNH', '', 'Phụ lục 01', '', ''],
    ['VÀ QUẢN TRỊ CÔNG', '', 'ĐẢNG CỘNG SẢN VIỆT NAM', '', ''],
    ['PHÂN HIỆU HỌC VIỆN', '', '', '', ''],
    ['HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG', '', '', '', ''],
    ['TẠI THÀNH PHỐ ĐÀ NẴNG', '', '', '', ''],
    ['*', '', '', '', ''],
    [],
    ['PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN CỦA SINH VIÊN'],
    [`Học kỳ: ${studentInfo.semester} - Năm học: ${studentInfo.academicYear}`],
    [],
    ['THÔNG TIN SINH VIÊN'],
    ['Họ và tên:', studentInfo.fullName, '', 'Mã sinh viên:', studentInfo.studentCode],
    ['Ngày sinh:', studentInfo.dateOfBirth || '', '', 'Lớp:', studentInfo.className],
    ['Khoa:', studentInfo.facultyName || '', '', 'Ngành:', studentInfo.majorName || ''],
    [],
    ['KẾT QUẢ ĐÁNH GIÁ 5 MỤC TIÊU CHÍ'],
    ['TT', 'Nội dung tiêu chí đánh giá', 'Điểm tối đa', 'Điểm SV tự chấm', 'Điểm Lớp chấm'],
    ['I', 'Ý thức tham gia học tập', 20, scores.sec1.sv, scores.sec1.class],
    ['II', 'Ý thức chấp hành nội quy, quy chế, quy định trong Học viện', 25, scores.sec2.sv, scores.sec2.class],
    ['III', 'Ý thức tham gia các hoạt động chính trị, xã hội, văn hóa, văn nghệ, thể thao', 20, scores.sec3.sv, scores.sec3.class],
    ['IV', 'Ý thức công dân trong quan hệ cộng đồng', 25, scores.sec4.sv, scores.sec4.class],
    ['V', 'Ý thức và kết quả tham gia phụ trách lớp, đoàn thể, tổ chức trong Học viện', 10, scores.sec5.sv, scores.sec5.class],
    ['', 'TỔNG CỘNG', 100, scores.totalSv, scores.totalClass],
    ['', 'XẾP LOẠI RÈN LUYỆN', '', scores.ratingSv || 'Chưa xếp loại', scores.ratingClass || 'Chưa xếp loại'],
    [],
    ['', '', 'Đà Nẵng, ngày...... tháng...... năm 20...', '', ''],
    ['', 'LỚP TRƯỞNG', '', 'SINH VIÊN TỰ ĐÁNH GIÁ', ''],
    ['', '(Ký và ghi rõ họ tên)', '', '(Ký và ghi rõ họ tên)', ''],
    [],
    [],
    ['', '', '', studentInfo.fullName, ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },  // TT
    { wch: 55 }, // Nội dung
    { wch: 14 }, // Điểm tối đa
    { wch: 18 }, // Điểm SV
    { wch: 18 }, // Điểm Lớp
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 0, c: 2 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 4 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 4 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 4 } },
    { s: { r: 15, c: 0 }, e: { r: 15, c: 4 } },
    { s: { r: 25, c: 2 }, e: { r: 25, c: 4 } },
    { s: { r: 26, c: 3 }, e: { r: 26, c: 4 } },
    { s: { r: 27, c: 3 }, e: { r: 27, c: 4 } },
    { s: { r: 30, c: 3 }, e: { r: 30, c: 4 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Phieu_Danh_Gia');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const safeName = (studentInfo.studentCode || 'PhieuDanhGia').replace(/\s+/g, '_');
  saveAs(
    new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `PhieuDanhGia_${safeName}.xlsx`
  );
}
