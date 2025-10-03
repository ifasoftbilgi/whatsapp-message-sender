const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3002;

const app = express();
app.use(bodyParser.json());

// ✅ API Key kontrolü
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }

    next();
});

// ✅ Log klasörü oluştur
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// ✅ Log yazma fonksiyonu
function logToFile(data) {
    const logPath = path.join(logDir, 'whatsapp.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${data}\n`);
}

// ✅ WhatsApp istemcisi başlatılıyor
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        //executablePath: '/usr/bin/chromium-browser',
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Kodunu tarayın.');
});
client.on('ready', () => {
    console.log('WhatsApp Web bağlantısı kuruldu.');
});

// ✅ MESAJ GÖNDERME (Numara doğrulamalı)
app.post('/send-message', async (req, res) => {
    const number = req.body.number;
    const message = req.body.message;
    const timestamp = new Date().toISOString();

    try {
        const numberId = await client.getNumberId(number);
        if (!numberId) {
            const logData = {
                status: "error",
                type: "validation",
                ip: req.ip,
                number,
                error: "Numara WhatsApp kullanıcısı değil",
                timestamp
            };
            logToFile(JSON.stringify(logData));
            return res.status(400).json(logData);
        }

        const response = await client.sendMessage(numberId._serialized, message);
        const logData = {
            status: "success",
            type: "message",
            ip: req.ip,
            number,
            message,
            messageId: response.id.id,
            timestamp
        };
        logToFile(JSON.stringify(logData));
        return res.status(200).json(logData);
    } catch (err) {
        const logData = {
            status: "error",
            type: "message",
            ip: req.ip,
            number,
            message,
            error: err.message,
            timestamp
        };
        logToFile(JSON.stringify(logData));
        return res.status(500).json(logData);
    }
});

// ✅ MEDYA GÖNDERME (Numara doğrulamalı)
app.post('/send-media', async (req, res) => {
    const number = req.body.number;
    const fileUrl = req.body.fileUrl;
    const timestamp = new Date().toISOString();

    try {
        const numberId = await client.getNumberId(number);
        if (!numberId) {
            const logData = {
                status: "error",
                type: "validation",
                ip: req.ip,
                number,
                error: "Numara WhatsApp kullanıcısı değil",
                timestamp
            };
            logToFile(JSON.stringify(logData));
            return res.status(400).json(logData);
        }

        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const media = new MessageMedia('image/jpeg', Buffer.from(response.data).toString('base64'));
        const sendResult = await client.sendMessage(numberId._serialized, media);

        const logData = {
            status: "success",
            type: "media",
            ip: req.ip,
            number,
            fileUrl,
            messageId: sendResult.id.id,
            timestamp
        };
        logToFile(JSON.stringify(logData));
        return res.status(200).json(logData);
    } catch (err) {
        const logData = {
            status: "error",
            type: "media",
            ip: req.ip,
            number,
            fileUrl,
            error: err.message,
            timestamp
        };
        logToFile(JSON.stringify(logData));
        return res.status(500).json(logData);
    }
});

// ✅ VİDEO GÖNDERME (Numara doğrulamalı)
app.post('/send-video', async (req, res) => {
    const number = req.body.number;
    const fileUrl = req.body.fileUrl;
    const timestamp = new Date().toISOString();

    try {
        const numberId = await client.getNumberId(number);
        if (!numberId) {
            const logData = {
                status: "error",
                type: "validation",
                ip: req.ip,
                number,
                error: "Numara WhatsApp kullanıcısı değil",
                timestamp
            };
            logToFile(JSON.stringify(logData));
            return res.status(400).json(logData);
        }

        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const media = new MessageMedia('video/mp4', Buffer.from(response.data).toString('base64'));
        const sendResult = await client.sendMessage(numberId._serialized, media);

        const logData = {
            status: "success",
            type: "video",
            ip: req.ip,
            number,
            fileUrl,
            messageId: sendResult.id.id,
            timestamp
        };
        logToFile(JSON.stringify(logData));
        return res.status(200).json(logData);
    } catch (err) {
        const logData = {
            status: "error",
            type: "video",
            ip: req.ip,
            number,
            fileUrl,
            error: err.message,
            timestamp
        };
        logToFile(JSON.stringify(logData));
        return res.status(500).json(logData);
    }
});

// ✅ HTTPS Sunucusu Başlatılıyor
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
};

https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`🔐 HTTPS sunucu ${PORT} portunda çalışıyor...`);
});

// ✅ WhatsApp istemcisi başlatılıyor
client.initialize();
