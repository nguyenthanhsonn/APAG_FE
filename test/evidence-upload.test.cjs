const { test, after } = require('node:test');
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

const { uploadEvidenceFile } = require('../src/services/cloudinaryUpload.ts');
const { logEvidenceUploadError } = require('../src/services/evidenceUploadDiagnostics.ts');
const originalCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const originalPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const originalXhr = global.XMLHttpRequest;
after(() => {
  for (const [key, value] of Object.entries({ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: originalCloud, NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: originalPreset })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  global.XMLHttpRequest = originalXhr;
});
const file = new File(['test'], 'evidence.pdf', { type: 'application/pdf' });
function mockResponse(status, body, event = 'onload') {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'test-preset';
  const requests = [];
  global.XMLHttpRequest = class {
    constructor() { requests.push(this); this.upload = {}; }
    open(method, url) { this.method = method; this.url = url; }
    send(bodyData) {
      this.body = bodyData;
      this.status = status;
      this.responseText = typeof body === 'string' ? body : JSON.stringify(body);
      queueMicrotask(() => this[event]());
    }
  };
  return () => requests.at(-1);
}

test('valid Cloudinary response resolves only with both URL and public id', async () => {
  const request = mockResponse(200, { secure_url: 'https://example.test/file.pdf', public_id: 'test-id' });
  assert.deepEqual(await uploadEvidenceFile(file), { secureUrl: 'https://example.test/file.pdf', publicId: 'test-id' });
  assert.equal(request().timeout, 120_000);
  assert.equal(request().body.get('upload_preset'), 'test-preset');
});
test('preserves Cloudinary error reason and HTTP status for diagnosis', async () => {
  mockResponse(400, { error: { message: 'Upload preset must be unsigned' } });
  await assert.rejects(uploadEvidenceFile(file), error => error.statusCode === 400 && error.message.includes('Upload preset must be unsigned'));
});
test('rejects non-JSON and incomplete success responses before linking evidence', async () => {
  for (const body of ['<html>gateway error</html>', {}, { secure_url: 'https://example.test/file' }, null]) {
    mockResponse(200, body);
    await assert.rejects(uploadEvidenceFile(file), /Phản hồi từ Cloudinary không hợp lệ/);
  }
});
test('network failure, timeout and cancellation settle the upload promise', async () => {
  for (const event of ['onerror', 'ontimeout', 'onabort']) {
    mockResponse(0, '', event);
    await assert.rejects(uploadEvidenceFile(file));
  }
});
test('missing config rejects at upload time rather than breaking page import', async () => {
  mockResponse(200, {});
  delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  await assert.rejects(uploadEvidenceFile(file), /Thiếu cấu hình Cloudinary/);
});
test('diagnostics include stage and backend errors without headers or file contents', () => {
  const output = [];
  const original = console.error;
  console.error = (...args) => output.push(args);
  try {
    logEvidenceUploadError('link-evidence', Object.assign(new Error('Version conflict'), {
      statusCode: 409, errors: ['expectedVersion'], headers: { Authorization: 'secret-token' },
    }), { criteriaCode: 'I.2.A', fileSize: 4 });
  } finally { console.error = original; }
  assert.equal(output[0][0], '[evidence-upload]');
  assert.equal(output[0][1].stage, 'link-evidence');
  assert.equal(output[0][1].statusCode, 409);
  assert.deepEqual(output[0][1].errors, ['expectedVersion']);
  assert.ok(!JSON.stringify(output).includes('secret-token'));
});
