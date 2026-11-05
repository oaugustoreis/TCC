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
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => { entry.payload = Buffer.concat(chunks).toString('utf8'); });
    res.on('finish', () => {
        entry.status = res.statusCode;
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
