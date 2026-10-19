// 启动脚本：本地HTTP服务器
const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 8080;
const mime = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
};
const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const fp = path.join(__dirname, p);
    fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); res.end('404 Not Found'); return; }
        const ext = path.extname(fp);
        res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
        res.end(data);
    });
});
server.listen(port, () => {
    console.log('=================================');
    console.log('  像素沙盒 - 游戏服务器已启动');
    console.log('  访问地址: http://localhost:' + port);
    console.log('  按 Ctrl+C 停止服务器');
    console.log('=================================');
});