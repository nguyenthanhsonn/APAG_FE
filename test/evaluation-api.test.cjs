const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Compile only local TS modules for Node's built-in test runner; no DOM/network or extra dependency.
require.extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
  module._compile(result.outputText, filename);
};
const { EvaluationTransport } = require('../src/api/evaluationTransport.ts');
const form = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const url = `/training-evaluations/${form}/submit`;
const failure = statusCode => Object.assign(new Error('test error'), { statusCode });
const storage = () => { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }; };
const load = (transport, id = form, version = 0) => transport.run({ url: `/training-evaluations/${id}`, method: 'GET' }, async () => ({ id, version }));

test('same-form autosaves are serialized and use the preceding response version', async () => {
  const api = new EvaluationTransport(); await load(api);
  const seen = []; let active = 0; let max = 0;
  const send = async config => { active++; max = Math.max(max, active); seen.push(config.data.expectedVersion); await new Promise(r => setTimeout(r, 5)); active--; return { id: form, version: config.data.expectedVersion + 1 }; };
  await Promise.all(['study-score', 'discipline-score', 'role-score'].map(section => api.run({ url: `/training-evaluations/${form}/${section}`, method: 'PATCH', data: { score: 1 } }, send)));
  assert.equal(max, 1); assert.deepEqual(seen, [0, 1, 2]);
});
test('double-click shares one HTTP request and one key', async () => {
  const api = new EvaluationTransport(); await load(api); let count = 0;
  const send = async config => { count++; assert.ok(config.headers['Idempotency-Key']); await new Promise(r => setTimeout(r, 5)); return { id: form, version: 1 }; };
  const [a, b] = await Promise.all([api.run({ url, method: 'POST' }, send), api.run({ url, method: 'POST' }, send)]);
  assert.deepEqual(a, b); assert.equal(count, 1);
});
test('network retry preserves key and original version even after a newer read', async () => {
  const api = new EvaluationTransport(); await load(api); let first;
  await assert.rejects(api.run({ url, method: 'POST' }, async config => { first = config; throw failure(); }));
  await load(api, form, 8);
  await api.run({ url, method: 'POST' }, async config => { assert.equal(config.headers['Idempotency-Key'], first.headers['Idempotency-Key']); assert.equal(config.data.expectedVersion, 0); return { id: form, version: 1 }; });
});
test('pending request survives page reload through session storage', async () => {
  const store = storage(); const api = new EvaluationTransport(store, 'actor-1'); await load(api); let key;
  await assert.rejects(api.run({ url, method: 'POST' }, async config => { key = config.headers['Idempotency-Key']; throw failure(503); }));
  await new EvaluationTransport(store, 'actor-1').run({ url, method: 'POST' }, async config => { assert.equal(config.headers['Idempotency-Key'], key); assert.equal(config.data.expectedVersion, 0); return { id: form, version: 1 }; });
});
test('unknown outcome blocks a different intent on the same form', async () => {
  const api = new EvaluationTransport(); await load(api);
  await assert.rejects(api.run({ url, method: 'POST' }, async () => { throw failure(); }));
  await assert.rejects(api.run({ url: `/training-evaluations/${form}/role-score`, method: 'PATCH', data: { score: 3 } }, async () => { assert.fail('must not send a different write'); }), error => error.statusCode === 409);
});
test('409 does not retry or discard the local edit; explicit reload is required', async () => {
  const api = new EvaluationTransport(); await load(api); let calls = 0;
  const send = async () => { calls++; throw failure(409); };
  await assert.rejects(api.run({ url, method: 'POST' }, send));
  await assert.rejects(api.run({ url, method: 'POST' }, send)); assert.equal(calls, 1);
  await load(api, form, 4);
  await api.run({ url, method: 'POST' }, async config => { assert.equal(config.data.expectedVersion, 4); return { id: form, version: 5 }; });
});
test('successful command ends its intent, so a later workflow cycle gets a new key', async () => {
  const api = new EvaluationTransport(); await load(api); const keys = [];
  const send = async config => { keys.push(config.headers['Idempotency-Key']); return { id: form, version: config.data.expectedVersion + 1 }; };
  await api.run({ url, method: 'POST' }, send); await api.run({ url, method: 'POST' }, send);
  assert.notEqual(keys[0], keys[1]);
});
test('selected bulk forwards ids and expectedVersions together', async () => {
  const api = new EvaluationTransport(); await load(api); await load(api, other, 3);
  await api.run({ url: '/admin/evaluations/bulk-finalize', method: 'PATCH', data: { ids: [form, other] } }, async config => {
    assert.deepEqual(config.data.expectedVersions, [{ id: form, version: 0 }, { id: other, version: 3 }]);
    assert.ok(config.headers['Idempotency-Key']); return { approvedCount: 2 };
  });
});
test('evidence uses the explicit parent and updates that parent version for the next write', async () => {
  const api = new EvaluationTransport(); await load(api);
  await api.run({ url: '/evidences/link-url', method: 'POST', data: { evaluationFormId: form, criteriaCode: 'I.2.A', imageUrl: 'https://example.test/x', publicId: 'x' } }, async config => {
    assert.equal(config.data.evaluationFormId, form); assert.equal(config.data.expectedVersion, 0);
    return { id: 'evidence-1', evaluationFormId: form, evaluationVersion: 1 };
  });
  await api.run({ url: '/evidences/evidence-1', method: 'DELETE' }, async config => { assert.equal(config.params.expectedVersion, 1); return { id: 'evidence-1', evaluationFormId: form, evaluationVersion: 2 }; });
});
test('an older in-flight GET cannot roll a successful write version backwards', async () => {
  const api = new EvaluationTransport(); await load(api); let release;
  const read = api.run({ url: `/training-evaluations/${form}`, method: 'GET' }, () => new Promise(resolve => { release = resolve; }));
  await api.run({ url, method: 'POST' }, async () => ({ id: form, version: 1 }));
  release({ id: form, version: 0 }); await read;
  await api.run({ url, method: 'POST' }, async config => { assert.equal(config.data.expectedVersion, 1); return { id: form, version: 2 }; });
});

// Exercise the actual Axios API layer, including concurrent auth refresh and preserved command headers.
const browserStorage = storage(); global.localStorage = browserStorage;
global.CustomEvent = class extends Event { constructor(type, options) { super(type); this.detail = options?.detail; } };
let redirects = [];
global.window = { sessionStorage: storage(), location: { pathname: '/student/evaluation', replace: path => redirects.push(path) }, dispatchEvent() {} };
const { axiosInstance, get, post } = require('../src/api/api.ts');
const { API_Student } = require('../src/api/API_Student.ts');
const { API_Shared } = require('../src/api/API_Shared.ts');
const { AxiosError } = require('axios');
const response = (config, data) => ({ config, data: { data }, status: 200, statusText: 'OK', headers: {} });
function reject(config, status) { return Promise.reject(new AxiosError('request failed', 'ERR_BAD_RESPONSE', config, {}, { config, status, statusText: 'Error', headers: {}, data: { message: status === 403 ? 'Không có quyền' : 'Unauthorized' } })); }

test('concurrent 401 refreshes once; replay keeps Idempotency-Key and expectedVersion', async () => {
  browserStorage.setItem('accessToken', 'old'); browserStorage.setItem('refreshToken', 'refresh'); browserStorage.setItem('user', JSON.stringify({ id: 'api-actor' }));
  let refreshes = 0; const commands = [];
  axiosInstance.defaults.adapter = async config => {
    if (config.url === '/auth/refresh-token') { refreshes++; await new Promise(r => setTimeout(r, 10)); return response(config, { accessToken: 'new', refreshToken: 'rotated' }); }
    if (config.method === 'get' && config.url.includes('training-evaluations')) return response(config, { id: form, version: 7 });
    if (config.url === url) commands.push({ key: config.headers.get('Idempotency-Key'), version: JSON.parse(config.data).expectedVersion });
    if (config.headers.get('Authorization') !== 'Bearer new') return reject(config, 401);
    return response(config, { id: form, version: 8 });
  };
  await get(`/training-evaluations/${form}`);
  await Promise.all([post(url), get('/profile')]);
  assert.equal(refreshes, 1); assert.equal(commands.length, 2); assert.deepEqual(commands[0], commands[1]); assert.equal(commands[0].version, 7);
});
test('403 is surfaced, is not refreshed and is not converted into an empty list', async () => {
  let calls = 0; axiosInstance.defaults.adapter = async config => { calls++; return reject(config, 403); };
  await assert.rejects(API_Shared.getTrainingEvaluations({ classId: other }), error => error.statusCode === 403 && error.kind === 'forbidden');
  assert.equal(calls, 1);
});
test('401 without a refresh token clears the session and returns to login', async () => {
  browserStorage.removeItem('refreshToken'); redirects = [];
  axiosInstance.defaults.adapter = config => reject(config, 401);
  await assert.rejects(get('/profile'), error => error.statusCode === 401);
  assert.equal(browserStorage.getItem('accessToken'), null); assert.deepEqual(redirects, ['/login']);
});
test('evidence missing its parent form is rejected without fallback requests', async () => {
  let calls = 0; axiosInstance.defaults.adapter = async config => { calls++; return response(config, {}); };
  await assert.rejects(API_Student.linkEvidenceUrl({ criteriaCode: 'TC1', imageUrl: 'https://example.test/x', publicId: 'x' })); assert.equal(calls, 0);
});

test('mounted screens keep independent versions; refreshing another screen cannot authorize a stale write', async () => {
  const { createStudentApi } = require('../src/api/API_Student.ts');
  const screenA = createStudentApi(new EvaluationTransport());
  const screenB = createStudentApi(new EvaluationTransport());
  let read = 0; let expected;
  axiosInstance.defaults.adapter = async config => {
    if (config.method === 'get') return response(config, { id: form, version: read++ === 0 ? 0 : 9 });
    expected = JSON.parse(config.data).expectedVersion;
    return reject(config, 409);
  };
  await screenA.getEvaluationDetail(form);
  await screenB.getEvaluationDetail(form);
  await assert.rejects(screenA.updateRoleScore(form, { studentRoleType: 'NORMAL_STUDENT', normalStudentActivityScore: 1 }), error => error.statusCode === 409);
  assert.equal(expected, 0);
});

test('scoped admin API translates selected bulk payload and shares versions with reviewer class forwarding', async () => {
  const { createAdminApi } = require('../src/api/API_Admin.ts');
  const transport = new EvaluationTransport();
  const admin = createAdminApi(transport);
  const requests = [];
  axiosInstance.defaults.adapter = async config => {
    if (config.method === 'get') return response(config, { items: [{ id: form, version: 3 }] });
    requests.push({ url: config.url, data: JSON.parse(config.data), key: config.headers.get('Idempotency-Key') });
    return response(config, { approvedCount: 1 });
  };
  await admin.getAdminEvaluations();
  await admin.bulkFinalizeEvaluations({ evaluationIds: [form] });
  assert.deepEqual(requests[0].data.ids, [form]);
  assert.equal(requests[0].data.evaluationIds, undefined);
  assert.deepEqual(requests[0].data.expectedVersions, [{ id: form, version: 3 }]);
  await admin.submitClassToAdvisor(other, { evaluationIds: [form] });
  assert.deepEqual(requests[1].data.expectedVersions, [{ id: form, version: 3 }]);
  assert.ok(requests[1].key);
});

// The socket's HTTP recovery must not resurrect credentials after session disposal.
test('late socket recovery refresh after logout cannot restore cleared credentials', async () => {
  browserStorage.setItem('accessToken', 'socket-old-access'); browserStorage.setItem('refreshToken', 'socket-old-refresh');
  let finishRefresh;
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  axiosInstance.defaults.adapter = config => {
    if (config.url === '/auth/refresh-token') return new Promise(resolve => { finishRefresh = () => resolve(response(config, { accessToken: 'late-access', refreshToken: 'late-refresh' })); started(); });
    return reject(config, 401);
  };
  const pending = assert.rejects(get('/auth/me'), error => error.statusCode === 401);
  await ready;
  browserStorage.removeItem('accessToken'); browserStorage.removeItem('refreshToken');
  finishRefresh(); await pending;
  assert.equal(browserStorage.getItem('accessToken'), null); assert.equal(browserStorage.getItem('refreshToken'), null);
});
test('old socket recovery cannot clear or overwrite a newer account while its refresh is pending', async () => {
  browserStorage.setItem('accessToken', 'old-account-access'); browserStorage.setItem('refreshToken', 'old-account-refresh');
  let finishOld, finishNew, startOld, startNew;
  const oldReady = new Promise(resolve => { startOld = resolve; });
  const newReady = new Promise(resolve => { startNew = resolve; });
  axiosInstance.defaults.adapter = config => {
    if (config.url === '/auth/refresh-token') {
      const body = JSON.parse(config.data);
      return new Promise(resolve => {
        if (body.refreshToken === 'old-account-refresh') { finishOld = () => resolve(response(config, { accessToken: 'stale', refreshToken: 'stale-refresh' })); startOld(); }
        else { finishNew = () => resolve(response(config, { accessToken: 'new-rotated', refreshToken: 'new-rotated-refresh' })); startNew(); }
      });
    }
    if (config.headers.Authorization === 'Bearer new-rotated') return Promise.resolve(response(config, { id: 'new-user' }));
    return reject(config, 401);
  };
  const oldRequest = assert.rejects(get('/auth/me'), error => error.statusCode === 401);
  await oldReady;
  browserStorage.setItem('accessToken', 'new-account-access'); browserStorage.setItem('refreshToken', 'new-account-refresh');
  const newRequest = get('/auth/me'); await newReady;
  finishOld(); await oldRequest;
  assert.equal(browserStorage.getItem('accessToken'), 'new-account-access');
  finishNew(); await newRequest;
  assert.equal(browserStorage.getItem('accessToken'), 'new-rotated'); assert.equal(browserStorage.getItem('refreshToken'), 'new-rotated-refresh');
});


test('refresh cannot resume socket session after logout begins while credentials still exist', async () => {
  browserStorage.setItem('accessToken', 'closing-access'); browserStorage.setItem('refreshToken', 'closing-refresh');
  const { notifyAuthSession } = require('../src/utils/authSession.ts');
  let finish, started;
  const ready = new Promise(resolve => { started = resolve; });
  axiosInstance.defaults.adapter = config => {
    if (config.url === '/auth/refresh-token') return new Promise(resolve => { finish = () => resolve(response(config, { accessToken: 'resurrected', refreshToken: 'resurrected-refresh' })); started(); });
    return reject(config, 401);
  };
  const pending = assert.rejects(get('/auth/me'), error => error.statusCode === 401);
  await ready; notifyAuthSession('ending'); finish(); await pending;
  assert.equal(browserStorage.getItem('accessToken'), null);
  notifyAuthSession();
});

test('report export submits a background job, polls, then downloads the completed file', async () => {
  const { API_Admin } = require('../src/api/API_Admin.ts');
  browserStorage.setItem('accessToken', 'export-access'); browserStorage.setItem('refreshToken', 'export-refresh');
  const calls = []; let polls = 0;
  const file = new Blob(['synthetic-report'], { type: 'application/pdf' });
  axiosInstance.defaults.adapter = config => {
    calls.push(config.url);
    if (config.url === '/reports/exports') {
      assert.equal(JSON.parse(config.data).format, 'pdf');
      assert.ok(config.headers['Idempotency-Key']);
      return Promise.resolve(response(config, { jobId: 'report-test-job' }));
    }
    if (config.url === '/reports/exports/report-test-job') return Promise.resolve(response(config, { jobId: 'report-test-job', status: polls++ ? 'completed' : 'processing' }));
    assert.equal(config.url, '/reports/exports/report-test-job/download'); assert.equal(config.responseType, 'blob');
    return Promise.resolve({ ...response(config, null), data: file });
  };
  assert.equal(await API_Admin.exportReportPdf({ academicYear: '2025-2026' }), file);
  assert.deepEqual(calls, ['/reports/exports', '/reports/exports/report-test-job', '/reports/exports/report-test-job', '/reports/exports/report-test-job/download']);
});
test('failed report export surfaces failure without attempting to download', async () => {
  const { API_Admin } = require('../src/api/API_Admin.ts');
  axiosInstance.defaults.adapter = config => {
    if (config.url === '/reports/exports') return Promise.resolve(response(config, { jobId: 'failed-report-job' }));
    assert.equal(config.url, '/reports/exports/failed-report-job');
    return Promise.resolve(response(config, { jobId: 'failed-report-job', status: 'failed', error: 'Report generation failed' }));
  };
  await assert.rejects(API_Admin.exportReportExcel(), /Report generation failed/);
});
