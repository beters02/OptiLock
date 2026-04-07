const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 6767;
const ROOT = __dirname;
const LOGS_DIR = path.join(ROOT, 'logs');
const DL_DIR = path.join(ROOT, 'downloads');

if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Get log file based on current date
function getLogFile() {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return path.join(LOGS_DIR, `${date}.log`);
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.html': return 'text/html; charset=utf-8';
        case '.js': return 'application/javascript; charset=utf-8';
        case '.css': return 'text/css; charset=utf-8';
        case '.json': return 'application/json; charset=utf-8';
        case '.txt': return 'text/plain; charset=utf-8';
        default: return 'application/octet-stream';
    }
}

function serveFile(filePath, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }

        res.writeHead(200, { 'Content-Type': getContentType(filePath) });
        res.end(data);
    });
}

function postLog(data, pathname, req, res) {
    let infoStamp = 'INFO'
    if (pathname === "/err") {
        infoStamp = 'ERROR'
    }

    const message = String(data.message || '');

    const timestamp = new Date().toISOString();
    const line = `[${infoStamp}] [${timestamp}] ${message}\n`;

    const logFile = getLogFile();

    fs.appendFile(logFile, line, err => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Failed to write log');
            return;
        }

        res.writeHead(200);
        res.end('OK');
    });
}

async function downloadGithubContent(data, res) {
    const url = 'https://raw.githubusercontent.com/dacooderr/OptiLock/main/gameinfo.gi';
    const response = await fetch(url);
    const text = await response.text();

    let dlFile = path.join(DL_DIR, `gameinfo.gi`);

    fs.writeFile(dlFile, text, err => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Failed to download file');
            console.log('Failed to download github file');
            return;
        }
        
        console.log('Downloaded github file');
        res.writeHead(200);
        res.end('OK');
    })

    console.log(text);
}

function handleBody(req) {
    let body = '';

    req.on('data', chunk => {
        body += chunk;
        if (body.length > 1e6) req.socket.destroy();
    });

    return body;
}

function getData(body) {
    return JSON.parse(body || '{}')
}

function endCatchHandler(res) {
    res.writeHead(400);
    res.end('Invalid JSON');
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (req.method === 'POST') {
        let body = handleBody(req);
        let data = getData(body);
        
        // LOG ENDPOINT
        if (pathname === '/log' || pathname === '/err') {
            req.on('end', () => {
                try {
                    postLog(data, pathname, req, res)
                    return;
                } catch (err) {
                    endCatchHandler(res);
                }
            });

        // GITHUB DOWNLOADER ENDPOINT
        } else if (pathname === '/githubdl') {
            try {
                downloadGithubContent(data, res)
                return;
            } catch (err) {
                endCatchHandler(res);
            }
        }
    } else if (req.method === 'GET') {
        let body = handleBody(req);
        let data = getData(body);

        if (pathname === '/githubrec') {
            try {
                readFile('/etc/passwd', (err, data) => {
                    if (err) throw err;
                    console.log(data);
                    });
            }
        }
    }

    let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);

    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    serveFile(filePath, res);
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});