import fs from 'node:fs';
import { createServer } from '../../api/server.js';

// Instrumentação externa: não altera a API nem os 24 arquivos modulares.
const server = createServer();
let sequence = 0;
server.prependListener('request', (req, res) => {
    const entry = {
        sequence: ++sequence,
        method: req.method,
        path: req.url,
        headers: req.headers,
        rawHeaders: req.rawHeaders,
        payload: '',
    };
    const responseChunks = [];
    const explicitHeaders = {};
    const originalWriteHead = res.writeHead;
    res.writeHead = function (statusCode, statusMessage, headers) {
        const values = typeof statusMessage === 'object' ? statusMessage : headers;
        if (Array.isArray(values)) {
            for (let i = 0; i < values.length; i += 2) explicitHeaders[String(values[i]).toLowerCase()] = values[i + 1];
        } else if (values) {
            for (const [key, value] of Object.entries(values)) explicitHeaders[key.toLowerCase()] = value;
        }
        return originalWriteHead.apply(this, arguments);
    };
    const capture = (chunk, encoding) => {
        if (chunk !== undefined && chunk !== null && typeof chunk !== 'function')
            responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === 'string' ? encoding : undefined));
    };
    const originalWrite = res.write;
    const originalEnd = res.end;
    res.write = function (chunk, encoding, callback) { capture(chunk, encoding); return originalWrite.call(this, chunk, encoding, callback); };
    res.end = function (chunk, encoding, callback) { capture(chunk, encoding); return originalEnd.call(this, chunk, encoding, callback); };
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => { entry.payload = Buffer.concat(chunks).toString('utf8'); });
    res.on('finish', () => {
        entry.status = res.statusCode;
        entry.responseHeaders = { ...res.getHeaders(), ...explicitHeaders };
        entry.responseBody = Buffer.concat(responseChunks).toString('utf8');
        fs.appendFileSync(process.env.TRACE_FILE, `${JSON.stringify(entry)}\n`);
    });
});
server.on('error', error => {
    console.error(error);
    process.exitCode = 1;
});
server.listen(Number(process.env.PORT || 3333), '127.0.0.1', () => {
    fs.writeFileSync(process.env.READY_FILE, JSON.stringify(server.address()));
    console.log(`API_READY ${JSON.stringify(server.address())}`);
});
