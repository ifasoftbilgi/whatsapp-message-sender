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

// Güvenlik: API anahtar kontrolü
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }

    next();
});

// Log klasörü ve fonksiyon
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
function logToFile(data) {
    const logPath = path.join(logDir, 'whatsapp.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${data}\n`);
}

// WhatsApp istemcisi
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
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

// ✅ MESAJ gönderme
app.post('/send-message', async (req, res) => {
    const number = req.body.number;
    const message = req.body.message;
    const chatId = number + '@c.us';

    try {
        const response = await client.sendMessage(chatId, message);
        const log = `✅ MESAJ | IP: ${req.ip} | Numara: ${number} | Mesaj: ${message} | ID: ${response.id.id}`;
        logToFile(log);
        return res.status(200).send('Mesaj başarıyla gönderildi.');
    } catch (err) {
        const log = `❌ MESAJ | IP: ${req.ip} | Numara: ${number} | Mesaj: ${message} | HATA: ${err.message}`;
        logToFile(log);
        return res.status(500).send('Mesaj gönderilemedi.');
    }
});

// ✅ MEDYA gönderme
app.post('/send-media', async (req, res) => {
    const number = req.body.number;
    const fileUrl = req.body.fileUrl;
    const chatId = number + '@c.us';

    try {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const media = new MessageMedia('image/jpeg', Buffer.from(response.data).toString('base64'));
        const sendResult = await client.sendMessage(chatId, media);
        const log = `✅ MEDYA | IP: ${req.ip} | Numara: ${number} | Dosya: ${fileUrl} | ID: ${sendResult.id.id}`;
        logToFile(log);
        return res.status(200).send('Resim başarıyla gönderildi.');
    } catch (err) {
        const log = `❌ MEDYA | IP: ${req.ip} | Numara: ${number} | Dosya: ${fileUrl} | HATA: ${err.message}`;
        logToFile(log);
        return res.status(500).send('Resim gönderilemedi.');
    }
});

// ✅ VİDEO gönderme
app.post('/send-video', async (req, res) => {
    const number = req.body.number;
    const fileUrl = req.body.fileUrl;
    const chatId = number + '@c.us';

    try {
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const media = new MessageMedia('video/mp4', Buffer.from(response.data).toString('base64'));
        const sendResult = await client.sendMessage(chatId, media);
        const log = `✅ VİDEO | IP: ${req.ip} | Numara: ${number} | Dosya: ${fileUrl} | ID: ${sendResult.id.id}`;
        logToFile(log);
        return res.status(200).send('Video başarıyla gönderildi.');
    } catch (err) {
        const log = `❌ VİDEO | IP: ${req.ip} | Numara: ${number} | Dosya: ${fileUrl} | HATA: ${err.message}`;
        logToFile(log);
        return res.status(500).send('Video gönderilemedi.');
    }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor; port: ${PORT}`);
});

// WhatsApp istemcisini başlat
client.initialize();
