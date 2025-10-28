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
const p_executablePath = process.env.puppeteer;
const PORT = process.env.PORT || 3002;

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }
    next();
});

// ✅ Log klasörü
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

function logToFile(data) {
    const logPath = path.join(logDir, 'whatsapp.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${data}\n`);
}

// ✅ WhatsApp istemcisi
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
       // executablePath: '/usr/bin/chromium-browser',
        executablePath : p_executablePath || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
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



// ✅ MESAJ
app.post('/send-message', async (req, res) => {
    const number = req.body.number;
    const message = req.body.message;
    const timestamp = new Date().toISOString();

    if (number.startsWith("65")) {
        const logData = {
            status: "blocked",
            reason: "Singapur numaralarına mesaj gönderimi engellendi",
            ip: req.ip,
            number,
            message,
            timestamp
        };
        logToFile(JSON.stringify(logData));
        return res.status(403).json(logData);
    }

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

// ✅ MEDYA
app.post('/send-media', async (req, res) => {
    const number = req.body.number;
    const fileUrl = req.body.fileUrl;
    const timestamp = new Date().toISOString();

    if (number.startsWith("65")) {
        const logData = {
            status: "blocked",
            reason: "Singapur numaralarına medya gönderimi engellendi",
            ip: req.ip,
            number,
            fileUrl,
            timestamp
        };
        logToFile(JSON.stringify(logData));
        return res.status(403).json(logData);
    }

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

// ✅ VİDEO
app.post('/send-video', async (req, res) => {
    const number = req.body.number;
    const fileUrl = req.body.fileUrl;
    const timestamp = new Date().toISOString();

    if (number.startsWith("65")) {
        const logData = {
            status: "blocked",
            reason: "Singapur numaralarına video gönderimi engellendi",
            ip: req.ip,
            number,
            fileUrl,
            timestamp
        };
        logToFile(JSON.stringify(logData));
        return res.status(403).json(logData);
    }

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

// ✅ SON X SAATTE GELEN MESAJLAR
app.post('/get-recent-messages', async (req, res) => {
    const hours = parseInt(req.body.hours || "24");
    const since = Date.now() - (hours * 60 * 60 * 1000);

    try {
        const chats = await client.getChats();
        let messages = [];

        for (const chat of chats) {
            // Grup dışı mesajlar
            if (!chat.isGroup) {
                const msgs = await chat.fetchMessages({ limit: 200 });
                for (const msg of msgs) {
                    const msgTime = msg.timestamp * 1000;
                    if (msgTime >= since) {
                        // Gönderici ve alıcıyı ayırt et
                        const number = msg.fromMe
                            ? msg.to.split('@')[0]       // Mesajı ben gönderdiğimde karşı taraf
                            : msg.from.split('@')[0];    // Mesaj bana geldiyse gönderen

                        messages.push({
                            id: msg.id.id,
                            fromMe: msg.fromMe,
                            number: number,
                            timestamp: new Date(msgTime).toISOString(),
                            message: msg.body || "",
                            hasMedia: msg.hasMedia
                        });
                    }
                }
            }
        }

        messages.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        res.status(200).json({ status: "success", count: messages.length, messages });
    } catch (err) {
        res.status(500).json({
            status: "error",
            error: err.message
        });
    }
});

// ✅ SON X SAATTE X NUMARADAN GELEN MESAJLAR
app.post('/get-messages-from-numbers', async (req, res) => {
    const { numbers, hours } = req.body;

    if (!Array.isArray(numbers) || numbers.length === 0) {
        return res.status(400).json({ error: 'En az bir numara belirtilmelidir.' });
    }

    const since = Date.now() - (parseInt(hours || "24") * 60 * 60 * 1000);
    const results = [];

    for (const number of numbers) {
        const chatId = `${number}@c.us`;

        try {
            const chat = await client.getChatById(chatId);

            // Eğer chat hiç yoksa veya hiç mesaj yoksa atla
            if (!chat || typeof chat.fetchMessages !== 'function') {
                continue; // bu numara hiç işleme alınmasın
            }

            const messages = await chat.fetchMessages({ limit: 100 });

            // Gerçekten mesaj yoksa veya hiçbiri eşleşmiyorsa atla
            if (!Array.isArray(messages) || messages.length === 0) {
                continue;
            }

            const filtered = messages
            .filter(msg => msg.timestamp * 1000 >= since)
            .map(msg => ({
            id: msg.id.id,
            fromMe: msg.fromMe,
             number: msg.fromMe
            ? msg.to.split('@')[0]
            : msg.from.split('@')[0],
            timestamp: new Date(msg.timestamp * 1000).toISOString(),
            message: msg.body || "",
            hasMedia: msg.hasMedia,
            chatId: chatId // <--- bunu ekle
         }));

            // Eğer süzülmüş mesaj da yoksa boş nesne ekleme
            if (filtered.length > 0) {
                results.push({ number, count: filtered.length, messages: filtered });
            }

        } catch (err) {
            // Sadece gerçek hata varsa ekle, istemiyorsan bu bloğu silebilirsin
            console.error(`Hata (${number}): ${err.message}`);
        }
    }

    res.json({ status: "success", requested: numbers.length, results });
});

// ✅ Belirli bir mesaj ID'sinden medya bilgisi al (Binary içerik ile)
app.post('/get-media-by-id', async (req, res) => {
    const messageId = req.body.messageId;

    if (!messageId) {
        return res.status(400).json({ status: "error", error: "messageId zorunludur." });
    }

    try {
        const chats = await client.getChats();
        for (const chat of chats) {
            const messages = await chat.fetchMessages({ limit: 100 });
            const found = messages.find(msg => msg.id.id === messageId);

            if (found) {
                if (!found.hasMedia) {
                    return res.status(404).json({ status: "error", error: "Mesaj bir medya içermiyor." });
                }

                const media = await found.downloadMedia();
                const mediaBuffer = Buffer.from(media.data, 'base64');

                return res.status(200).json({
                    status: "success",
                    messageId: found.id.id,
                    number: found.fromMe 
                        ? found.to.split('@')[0] 
                        : found.from.split('@')[0],
                    timestamp: new Date(found.timestamp * 1000).toISOString(),
                    mediaType: media.mimetype,
                    mediaFileName: media.filename,
                    mediaContent: mediaBuffer.toString('base64') // Dilersen binary de dönebilirim
                });
            }
        }

        return res.status(404).json({ status: "error", error: "Mesaj ID bulunamadı." });

    } catch (err) {
        return res.status(500).json({
            status: "error",
            error: err.message
        });
    }
});

app.post('/get-media-from-chat-by-id', async (req, res) => {
    const { chatId, message_id } = req.body;

    if (!chatId || !message_id) {
        return res.status(400).json({
            status: "error",
            error: "chatId ve message_id zorunludur."
        });
    }

    try {
        const chat = await client.getChatById(chatId);
        const messages = await chat.fetchMessages({ limit: 200 });

        const found = messages.find(msg => msg.id.id === message_id);
        if (found) {
            let media = null;
            if (found.hasMedia) {
                media = await found.downloadMedia();
            }

            return res.status(200).json({
                status: "success",
                chatId: chatId,
                messageId: found.id.id,
                number: found.fromMe
                    ? found.to.split('@')[0]
                    : found.from.split('@')[0],
                timestamp: new Date(found.timestamp * 1000).toISOString(),
                text: found.body || "",
                mediaType: media?.mimetype || null,
                mediaFileName: media?.filename || null,
                mediaContent: media?.data || null
            });
        }

        return res.status(404).json({
            status: "error",
            error: "Bu chatId içinde bu ID'ye sahip mesaj bulunamadı."
        });

    } catch (err) {
        return res.status(500).json({
            status: "error",
            error: err.message
        });
    }
});




// ✅ HTTPS başlat
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
};

https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`🔐 HTTPS sunucu ${PORT} portunda çalışıyor...`);
});

// ✅ WhatsApp istemcisi başlat
client.initialize();