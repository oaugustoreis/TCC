// config/options.ts
var options = {
  insecureSkipTLSVerify: true,
  noConnectionReuse: false,
  discardResponseBodies: false,
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"]
};

// pulse/parsers/time-parser/toSeconds.ts
var DURATION_METRIC_NAMES = /* @__PURE__ */ new Set([
  "group_duration",
  "http_req_blocked",
  "http_req_duration",
  "http_req_waiting",
  "http_req_connecting",
  "http_req_tls_handshaking",
  "http_req_sending",
  "http_req_receiving",
  "iteration_duration"
]);
function convertDurationsToSeconds(data) {
  const converted = { ...data, metrics: {} };
  for (const [name, metric] of Object.entries(data.metrics || {})) {
    const isCustomMs = name.endsWith("_ms");
    const isBuiltIn = DURATION_METRIC_NAMES.has(name);
    const isDuration = isCustomMs || isBuiltIn;
    if (!isDuration) {
      converted.metrics[name] = metric;
      continue;
    }
    const values = { ...metric.values || {} };
    for (const key of Object.keys(values)) {
      if (typeof values[key] === "number") {
        values[key] = values[key] / 1e3;
      }
    }
    const newName = isCustomMs ? name.replace(/_ms$/, "_s") : `${name} (s)`;
    converted.metrics[newName] = { ...metric, values };
  }
  return converted;
}

// config/thresholds.ts
var thresholds = {
  http_req_duration: ["p(90)<1300", "p(95)<1600", "p(99)<2000"],
  http_req_failed: ["rate<0.01"],
  checks: ["rate>0.99"]
};

// pulse/core/pulse.ts
import { group as k6Group, sleep as k6Sleep, check as k6Check } from "k6";
import execution from "k6/execution";
function validateSchema(data, schema) {
  if (!schema) return true;
  if (schema.type) {
    if (schema.type === "object") {
      if (typeof data !== "object" || data === null || Array.isArray(data)) return false;
      if (schema.required && Array.isArray(schema.required)) {
        for (const req of schema.required) {
          if (!(req in data)) return false;
        }
      }
      if (schema.properties) {
        for (const prop in schema.properties) {
          if (prop in data) {
            if (!validateSchema(data[prop], schema.properties[prop])) {
              return false;
            }
          }
        }
      }
      return true;
    }
    if (schema.type === "array") {
      if (!Array.isArray(data)) return false;
      if (schema.items) {
        for (const item of data) {
          if (!validateSchema(item, schema.items)) return false;
        }
      }
      return true;
    }
    if (schema.type === "string") return typeof data === "string";
    if (schema.type === "number") return typeof data === "number";
    if (schema.type === "boolean") return typeof data === "boolean";
    if (schema.type === "integer") return Number.isInteger(data);
  }
  return true;
}
var ResponseExpectation = class {
  res;
  constructor(res) {
    this.res = res;
  }
  status(code) {
    k6Check(this.res, {
      [`Status is ${code}`]: () => this.res.status === code
    });
    return this;
  }
  bodyNotEmpty() {
    k6Check(this.res, {
      "Body is not empty": () => !!this.res.body && this.res.body.length > 0
    });
    return this;
  }
  header(name, expectedValue) {
    const headerName = name.toLowerCase();
    k6Check(this.res, {
      [`Header '${name}' is '${expectedValue}'`]: () => {
        const headers = this.res.headers || {};
        const actualValue = headers[name] || headers[headerName];
        return actualValue && actualValue.toLowerCase().includes(expectedValue.toLowerCase());
      }
    });
    return this;
  }
  hasProperty(path) {
    k6Check(this.res, {
      [`Has property '${path}'`]: () => {
        try {
          if (!this.res.body) return false;
          return this.res.json(path) !== void 0;
        } catch (e) {
          return false;
        }
      }
    });
    return this;
  }
  responseTimeLessThan(ms) {
    k6Check(this.res, {
      [`Response time is less than ${ms}ms`]: () => this.res.timings.duration < ms
    });
    return this;
  }
  jsonSchema(schema) {
    k6Check(this.res, {
      "Response matches JSON schema": () => {
        try {
          if (!this.res.body) return false;
          const data = this.res.json();
          return validateSchema(data, schema);
        } catch (e) {
          return false;
        }
      }
    });
    return this;
  }
};
var PulseCore = class {
  group(name, fn) {
    k6Group(name, fn);
  }
  sleep(seconds) {
    k6Sleep(seconds);
  }
  check(val, sets) {
    return k6Check(val, sets);
  }
  context() {
    let vu = 0;
    let iteration = 0;
    try {
      if (execution.vu) vu = execution.vu.idInTest;
    } catch (e) {
    }
    try {
      if (execution.scenario) iteration = execution.scenario.iterationInTest;
    } catch (e) {
    }
    return { vu, iteration };
  }
  expect(res) {
    return new ResponseExpectation(res);
  }
};
var ps = new PulseCore();

// pulse/plugins/plugin-manager.ts
function getSafeContext() {
  return ps.context();
}
var PluginManager = class {
  plugins = [];
  register(plugin) {
    this.plugins.push(plugin);
  }
  emitBeforeScenario(data) {
    this.plugins.forEach((p) => p.beforeScenario?.(data));
  }
  emitAfterScenario(data) {
    this.plugins.forEach((p) => p.afterScenario?.(data));
  }
  emitBeforeRequest(context) {
    this.plugins.forEach((p) => p.beforeRequest?.(context));
  }
  emitAfterRequest(response, context) {
    this.plugins.forEach((p) => p.afterRequest?.(response, context));
  }
};
var pluginManager = new PluginManager();

// pulse/reporter/customHtmlReporter.ts
function generateCustomHtmlReport(data) {
  const metrics = data.metrics;
  const totalRequests = metrics.http_reqs ? metrics.http_reqs.values.count : 0;
  const errorRate = metrics.http_req_failed ? (metrics.http_req_failed.values.rate * 100).toFixed(2) : "0.00";
  const successRate = (100 - parseFloat(errorRate)).toFixed(2);
  const avgDuration = metrics.http_req_duration ? metrics.http_req_duration.values.avg.toFixed(2) : "0.00";
  const p95Duration = metrics.http_req_duration ? metrics.http_req_duration.values["p(95)"].toFixed(2) : "0.00";
  const maxVus = metrics.vus ? metrics.vus.values.max : "N/A";
  const scenarioName2 = data.metadata ? data.metadata.scenario || "Load Test" : "Load Test";
  const date = (/* @__PURE__ */ new Date()).toLocaleString();
  const httpMetrics = Object.keys(metrics).filter((key) => key.startsWith("http_req_duration{") || key === "http_req_duration").map((key) => {
    const label = key.includes("expected_response") || key === "http_req_duration" ? "Global" : key.split("label:")[1]?.split("}")[0] || "Unknown";
    const m = metrics[key].values;
    const failedMetricKey = key.replace("duration", "failed");
    const count = metrics[key.replace("duration", "failed")]?.values.count || metrics.http_reqs?.values.count || 0;
    const failedRate = metrics[failedMetricKey]?.values.rate || 0;
    return {
      label,
      count,
      avg: m.avg.toFixed(2),
      p90: m["p(90)"] ? m["p(90)"].toFixed(2) : "N/A",
      p95: m["p(95)"] ? m["p(95)"].toFixed(2) : "N/A",
      p99: m["p(99)"] ? m["p(99)"].toFixed(2) : "N/A",
      failed: (failedRate * 100).toFixed(2)
    };
  }).filter((m) => m.label !== "Global");
  const checks = [];
  function extractChecks(group) {
    if (group.checks) {
      group.checks.forEach((c) => checks.push(c));
    }
    if (group.groups) {
      group.groups.forEach(extractChecks);
    }
  }
  extractChecks(data.root_group);
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pulse Load Test Report - ${scenarioName2}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0f19;
            --card-bg: rgba(22, 29, 49, 0.7);
            --border-color: rgba(255, 255, 255, 0.08);
            --primary: #4f46e5;
            --primary-glow: rgba(79, 70, 229, 0.3);
            --success: #10b981;
            --error: #ef4444;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            min-height: 100vh;
            padding: 2rem;
            line-height: 1.5;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2.5rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1.5rem;
        }

        .logo-title h1 {
            font-size: 2rem;
            font-weight: 800;
            letter-spacing: -0.5px;
            background: linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .meta-info {
            text-align: right;
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        .grid-kpi {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2.5rem;
        }

        .kpi-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(12px);
            transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .kpi-card:hover {
            transform: translateY(-2px);
            border-color: rgba(99, 102, 241, 0.4);
        }

        .kpi-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: var(--primary);
            opacity: 0.7;
        }

        .kpi-card.success::before { background: var(--success); }
        .kpi-card.error::before { background: var(--error); }

        .kpi-card .label {
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-muted);
            margin-bottom: 0.5rem;
        }

        .kpi-card .value {
            font-size: 2rem;
            font-weight: 800;
            color: var(--text-main);
        }

        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .section-title::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 18px;
            background: var(--primary);
            border-radius: 2px;
        }

        .card-table-wrapper {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.5rem;
            backdrop-filter: blur(12px);
            margin-bottom: 2.5rem;
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }

        th {
            color: var(--text-muted);
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        td {
            padding: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            font-size: 0.95rem;
        }

        tr:last-child td {
            border-bottom: none;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .badge-success {
            background: rgba(16, 185, 129, 0.15);
            color: var(--success);
        }

        .badge-error {
            background: rgba(239, 68, 68, 0.15);
            color: var(--error);
        }

        .badge-info {
            background: rgba(79, 70, 229, 0.15);
            color: #818cf8;
        }

        .progress-bar-container {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
            overflow: hidden;
            margin-top: 0.5rem;
        }

        .progress-bar-fill {
            height: 100%;
            background: var(--success);
            border-radius: 3px;
        }

        .progress-bar-fill.error {
            background: var(--error);
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo-title">
                <h1>PULSE FRAMEWORK</h1>
                <div style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;">Executive Performance Summary</div>
            </div>
            <div class="meta-info">
                <div>Scenario: <strong>${scenarioName2}</strong></div>
                <div>Executed at: <strong>${date}</strong></div>
            </div>
        </header>

        <div class="grid-kpi">
            <div class="kpi-card">
                <div class="label">Scenario Name</div>
                <div class="value" style="font-size: 1.1rem; font-weight: 600; margin-top: 0.7rem; word-break: break-all;">${scenarioName2}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Max VUs</div>
                <div class="value">${maxVus}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Total Requests</div>
                <div class="value">${totalRequests}</div>
            </div>
            <div class="kpi-card success">
                <div class="label">Success Rate</div>
                <div class="value" style="color: var(--success);">${successRate}%</div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${successRate}%;"></div>
                </div>
            </div>
            <div class="kpi-card error">
                <div class="label">Error Rate</div>
                <div class="value" style="color: var(--error);">${errorRate}%</div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill error" style="width: ${errorRate}%;"></div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="label">Avg Duration</div>
                <div class="value">${avgDuration} ms</div>
            </div>
            <div class="kpi-card">
                <div class="label">P(95) Duration</div>
                <div class="value" style="color: #a5b4fc;">${p95Duration} ms</div>
            </div>
        </div>

        ${httpMetrics.length > 0 ? `
        <h2 class="section-title">HTTP Requests Metrics</h2>
        <div class="card-table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Endpoint Label</th>
                        <th>Request Count</th>
                        <th>Avg (ms)</th>
                        <th>P90 (ms)</th>
                        <th>P95 (ms)</th>
                        <th>P99 (ms)</th>
                        <th>Failure Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${httpMetrics.map((m) => `
                        <tr>
                            <td><strong>${m.label}</strong></td>
                            <td>${m.count}</td>
                            <td>${m.avg}</td>
                            <td>${m.p90}</td>
                            <td>${m.p95}</td>
                            <td>${m.p99}</td>
                            <td>
                                <span class="badge ${parseFloat(m.failed) > 0 ? "badge-error" : "badge-success"}">
                                    ${m.failed}%
                                </span>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
        ` : ""}

        ${checks.length > 0 ? `
        <h2 class="section-title">Validation Checks</h2>
        <div class="card-table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Check Name</th>
                        <th>Successful Passes</th>
                        <th>Failures</th>
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${checks.map((c) => {
    const passRate = (c.passes / (c.passes + c.fails) * 100).toFixed(2);
    return `
                        <tr>
                            <td><strong>${c.name}</strong></td>
                            <td>${c.passes}</td>
                            <td>${c.fails}</td>
                            <td>
                                <span class="badge ${parseFloat(passRate) >= 99 ? "badge-success" : "badge-error"}">
                                    ${passRate}%
                                </span>
                            </td>
                        </tr>
                        `;
  }).join("")}
                </tbody>
            </table>
        </div>
        ` : ""}
    </div>
</body>
</html>`;
}

// pulse/plugins/index.ts
var LoggerPlugin = {
  name: "LoggerPlugin",
  afterRequest: (response, context) => {
    const { vu, iteration } = getSafeContext();
    const isError = response.status >= 400 || response.status === 0;
    const logType = isError ? "HTTP_REQUEST_FAILED" : "HTTP_REQUEST_SUCCESS";
    const logPayload = {
      action: context.label,
      type: logType,
      vu,
      iteration,
      method: context.method,
      status: response.status,
      duration_ms: Math.round(response.timings.duration * 100) / 100,
      url: context.url
    };
    const logFormat = __ENV.LOG_FORMAT || "json-pretty";
    if (logFormat === "json") {
      const output = JSON.stringify(logPayload);
      if (isError) console.error(output);
      else console.log(output);
    } else if (logFormat === "json-pretty") {
      const output = JSON.stringify(logPayload, null, 2);
      if (isError) {
        output.split("\n").forEach((line) => console.error(line));
        console.error("Request Failed");
      } else {
        output.split("\n").forEach((line) => console.log(line));
      }
    } else if (logFormat === "simple") {
      const statusColor = isError ? "\x1B[31m" : "\x1B[32m";
      const resetColor = "\x1B[0m";
      const methodColor = "\x1B[36m";
      const grayColor = "\x1B[90m";
      const yellowColor = "\x1B[33m";
      const statusEmoji = isError ? "\u274C" : "\u2705";
      const logMsg = `[HTTP] ${statusEmoji} ${methodColor}${context.method}${resetColor} ${context.url} - Status: ${statusColor}${response.status}${resetColor} - Time: ${yellowColor}${logPayload.duration_ms}ms${resetColor} ${grayColor}(VU: ${vu}, Iter: ${iteration})${resetColor}`;
      if (isError) {
        console.error(logMsg);
      } else {
        console.log(logMsg);
      }
    }
  }
};
var TracingPlugin = {
  name: "TracingPlugin",
  beforeRequest: (context) => {
    const traceId = `pulse-${Math.random().toString(36).substring(7)}`;
    context.params.headers["X-Pulse-Trace-Id"] = traceId;
  }
};
pluginManager.register(LoggerPlugin);
pluginManager.register(TracingPlugin);

// pulse/generated-env.ts
var RawEnv = {
  BASE_URL_DEV: __ENV.BASE_URL_DEV
};

// pulse/config/config-resolver.ts
var ConfigResolver = class {
  get(key, defaultValue) {
    const value = __ENV[key];
    return value || defaultValue || "";
  }
};
var configResolver = new ConfigResolver();
var Env = RawEnv;

// pulse/http/http.ts
import http from "k6/http";
function _request(method, url, body = null, params = {}, expectedStatus = 200, label = "") {
  const defaultHeaders = {
    "Content-Type": "application/json"
  };
  const token = params.token || __ENV.TOKEN;
  if (token && (!params.headers || !params.headers["Authorization"])) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }
  params.headers = { ...defaultHeaders, ...params.headers };
  const context = {
    method,
    url,
    body,
    params,
    label: label || method
  };
  pluginManager.emitBeforeRequest(context);
  const payload = body && typeof body === "object" ? JSON.stringify(body) : body;
  const res = http.request(method, url, payload, params);
  pluginManager.emitAfterRequest(res, context);
  const isExpectedStatus = Array.isArray(expectedStatus) ? expectedStatus.includes(res.status) : res.status === expectedStatus;
  ps.check(res, {
    [`${label || method} status is ${expectedStatus}`]: () => isExpectedStatus
  });
  return res;
}
function get(url, params = {}, expectedStatus = 200, label = "GET") {
  return _request("GET", url, null, params, expectedStatus, label);
}
function post(url, body, params = {}, expectedStatus = 201, label = "POST") {
  return _request("POST", url, body, params, expectedStatus, label);
}

// src/schemas/catalog/catalog.schema.ts
function isProduct(data) {
  return !!data && typeof data.id === "number" && typeof data.name === "string" && data.name.length > 0 && typeof data.price === "number";
}
function validateBody(response, label, contract) {
  let data = null;
  try {
    data = response.json();
  } catch (_) {
  }
  ps.check(data, { [label]: contract });
  return data;
}

// src/use-cases/catalog/getCatalog.useCase.ts
function authenticate(baseUrl) {
  const response = post(`${baseUrl}/authentication`, "{}", {}, 200, "auth");
  const data = validateBody(response, "auth token", (v) => !!v && typeof v.token === "string" && v.token.length > 0);
  return data && data.token;
}
function listProducts(baseUrl, token) {
  const response = get(`${baseUrl}/products`, { token }, 200, "list");
  return validateBody(response, "list products", (v) => Array.isArray(v) && v.length > 0 && isProduct(v[0]));
}
function productDetails(baseUrl, token, id) {
  const response = get(`${baseUrl}/products/${id}`, { token }, 200, "detail");
  return validateBody(response, "detail product", (v) => isProduct(v) && v.id === id);
}

// src/flows/catalog/catalog.flow.ts
function catalogFlow(baseUrl) {
  const token = authenticate(baseUrl);
  const items = listProducts(baseUrl, token);
  const selectedId = items && items[0] && items[0].id;
  productDetails(baseUrl, token, selectedId);
  ps.sleep(1);
}

// src/scenarios/catalog/catalog.scenario.ts
function setupCatalog() {
  return { baseUrl: Env.BASE_URL_DEV };
}
function catalogScenario(data) {
  catalogFlow(data.baseUrl);
}

// src/profiles/catalog/catalog.profiles.ts
var catalogProfiles = {
  "catalog_smoke_test": {
    executor: "constant-vus",
    exec: "engine",
    vus: 1,
    duration: "10s"
  }
};

// src/scenarios/catalog/thresholds.ts
var thresholds2 = {
  checks: ["rate==1"],
  http_req_failed: ["rate==0"],
  http_req_duration: ["p(95)<1500"]
};

// pulse/virtual-registry.ts
var registry = {
  ...Object.keys(catalogProfiles || {}).reduce((acc, key) => {
    acc[key] = {
      profile: catalogProfiles[key],
      setup: setupCatalog,
      scenarioFunc: catalogScenario,
      thresholds: thresholds2
    };
    return acc;
  }, {})
};

// src/main.ts
var scenarioName = __ENV.SCENARIO || "";
var config = registry[scenarioName];
if (!config) {
  throw new Error(
    `
\u274C Scenario "${scenarioName}" not found in Virtual Registry.`
  );
}
var finalThresholds = config.thresholds || thresholds;
var resolvedProfile = { ...config.profile };
if (__ENV.VUS) {
  resolvedProfile.vus = parseInt(__ENV.VUS, 10);
}
if (__ENV.DURATION) {
  if (resolvedProfile.executor && resolvedProfile.executor.includes("iterations")) {
    resolvedProfile.maxDuration = __ENV.DURATION;
  } else {
    resolvedProfile.duration = __ENV.DURATION;
  }
}
var finalScenarios = {
  [scenarioName]: resolvedProfile
};
var options2 = {
  ...options,
  thresholds: finalThresholds,
  scenarios: finalScenarios
};
function setup() {
  const setupData = config.setup ? config.setup() : {};
  pluginManager.emitBeforeScenario(setupData);
  return setupData;
}
function engine(data) {
  config.scenarioFunc(data);
}
var main_default = engine;
function teardown(data) {
  pluginManager.emitAfterScenario(data);
}
function handleSummary(data) {
  const dataWithSeconds = convertDurationsToSeconds(data);
  return {
    "summary.html": generateCustomHtmlReport(dataWithSeconds)
  };
}
export {
  main_default as default,
  engine,
  handleSummary,
  options2 as options,
  setup,
  teardown
};
