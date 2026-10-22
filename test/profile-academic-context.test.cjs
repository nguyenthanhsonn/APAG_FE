const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(result.outputText, filename);
};
const { resolveProfileAcademicContext } = require('../src/utils/profileAcademicContext.ts');
const assigned = {
  classId: 'assigned-class', classCode: 'QTNI-K25-L1', className: 'Quản trị nhân lực K25 - Lớp 1', enrollmentYear: 2025,
  major: { name: 'Quản trị nhân lực' }, faculty: { name: 'Khoa Kinh tế' },
};
test('class leader without student enrollment displays the assigned class, major, faculty and cohort year', () => {
  const result = resolveProfileAcademicContext({ role: 'class_leader', student: null, managedClasses: [assigned] });
  assert.deepEqual(result, {
    source: 'assignment', className: assigned.className, majorName: 'Quản trị nhân lực', facultyName: 'Khoa Kinh tế', admissionYear: 2025, studentCode: '',
  });
});
test('actual student enrollment takes priority over the class being managed', () => {
  const result = resolveProfileAcademicContext({ role: 'class_leader', student: {
    studentCode: 'SV001', class: { id: 'enrolled', name: 'Lớp đang học', enrollmentYear: 2024 }, major: { name: 'Ngành đang học' }, faculty: { name: 'Khoa đang học' },
  }, managedClasses: [assigned] });
  assert.equal(result.source, 'enrollment'); assert.equal(result.className, 'Lớp đang học');
  assert.equal(result.majorName, 'Ngành đang học'); assert.equal(result.facultyName, 'Khoa đang học');
  assert.equal(result.admissionYear, 2024); assert.equal(result.studentCode, 'SV001');
});
test('supports flattened profile data already normalized by the auth store', () => {
  const result = resolveProfileAcademicContext({ role: 'student', studentCode: 'SV002', class: { name: 'Lớp SV', enrollmentYear: 2023 }, major: 'Tên ngành cũ', faculty: { name: 'Tên khoa' } });
  assert.equal(result.className, 'Lớp SV'); assert.equal(result.majorName, 'Tên ngành cũ'); assert.equal(result.studentCode, 'SV002');
});
test('unassigned accounts remain empty instead of showing a fabricated 2021 year or a first catalog class', () => {
  const result = resolveProfileAcademicContext({ role: 'class_leader', managedClasses: [] });
  assert.equal(result.source, 'none'); assert.equal(result.className, ''); assert.equal(result.majorName, ''); assert.equal(result.facultyName, ''); assert.equal(result.admissionYear, undefined);
});
test('an advisor assignment is not treated as their own student enrollment', () => {
  const result = resolveProfileAcademicContext({ role: 'advisor', managedClasses: [assigned] });
  assert.equal(result.source, 'none'); assert.equal(result.className, ''); assert.equal(result.admissionYear, undefined);
});
test('does not guess between multiple managed classes', () => {
  const result = resolveProfileAcademicContext({ role: 'class_leader', managedClasses: [assigned, { ...assigned, classId: 'other' }] });
  assert.equal(result.source, 'none'); assert.equal(result.className, '');
});
test('refreshed assignment or removal clears the old displayed affiliation', () => {
  assert.equal(resolveProfileAcademicContext({ role: 'class_leader', managedClasses: [assigned] }).className, assigned.className);
  const changed = resolveProfileAcademicContext({ role: 'class_leader', managedClasses: [{ ...assigned, className: 'Lớp mới', enrollmentYear: 2026 }] });
  assert.equal(changed.className, 'Lớp mới'); assert.equal(changed.admissionYear, 2026);
  const removed = resolveProfileAcademicContext({ role: 'class_leader', managedClasses: [] });
  assert.equal(removed.className, ''); assert.equal(removed.admissionYear, undefined);
});
test('null/loading profile is safe and does not invent academic data', () => {
  const result = resolveProfileAcademicContext(null);
  assert.equal(result.source, 'none'); assert.equal(result.className, ''); assert.equal(result.studentCode, '');
});
