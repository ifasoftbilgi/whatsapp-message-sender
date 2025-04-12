const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
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
        executablePath: '/usr/bin/chromium-browser', // VPS'e uygun path
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

// ✅ MESAJ GÖNDERME
app.post('/send-message', async (req, res) => {
    const number = req.body.number;
    const message = req.body.message;
    const chatId = number + '@c.us';
    const timestamp = new Date().toISOString();

    try {
        const response = await client.sendMessage(chatId, message);
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

// ✅ MEDYA GÖNDERME
app.post('/send-media', async (req, res) => {
    const number = req.body.number;
    const fileUrl = req.body.fileUrl;
    const chatId = number + '@c.us';
    const timestamp = new Date().toISOString();

    try {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const media = new MessageMedia('image/jpeg', Buffer.from(response.data).toString('base64'));
        const sendResult = await client.sendMessage(chatId, media);

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

// ✅ VİDEO GÖNDERME
app.post('/send-video', async (req, res) => {
    const number = req.body.number;
    const fileUrl = req.body.fileUrl;
    const chatId = number + '@c.us';
    const timestamp = new Date().toISOString();

    try {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const media = new MessageMedia('video/mp4', Buffer.from(response.data).toString('base64'));
        const sendResult = await client.sendMessage(chatId, media);

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

// ✅ Sunucu başlatılıyor
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor; port: ${PORT}`);
});

// ✅ WhatsApp istemcisi başlatılıyor
client.initialize();
