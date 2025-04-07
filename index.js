const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();
const API_KEY = process.env.API_KEY; // Güvenli bir şekilde sakla!

const app = express();
app.use(bodyParser.json()); // JSON gövdesi kullanmak için body-parser'ı ekliyoruz

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Tüm domainlere izin vermek için
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    const apiKey = req.headers['x-api-key']; // İstek başlığından API key'i al

    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }

    next();
});

// WhatsApp istemcisini başlat
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  }
  });

// QR kodu terminalde göster
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Kodunu tarayın.');
});

// WhatsApp Web'e başarılı şekilde bağlanıldığında
client.on('ready', () => {
    console.log('WhatsApp Web bağlantısı kuruldu.');
});

// POST isteği ile mesaj gönderme
app.post('/send-message', (req, res) => {
    const number = req.body.number; // İstek gövdesinden telefon numarasını alıyoruzz
    const message = req.body.message; // İstek gövdesinden mesajı alıyoruz

    const chatId = number + '@c.us'; // Chat ID'yi oluşturuyoruz

    client.sendMessage(chatId, message).then(response => {
        console.log(`Mesaj başarıyla gönderildi: ${response.id.id}`);
        res.status(200).send('Mesaj başarıyla gönderildi.>');
    }).catch(err => {
        console.error('Mesaj gönderilemedi:', err);
        res.status(500).send('Mesaj gönderilemedi');
    });
});

// POST isteği ile resim gönderme
/*app.post('/send-media', (req, res) => {
    const number = req.body.number; // Telefon numarası
    const filePath = req.body.filePath; // Gönderilecek dosya yolu

    const chatId = number + '@c.us'; // Chat ID'yi oluşturuyoruz

    // Dosyanın mevcut olup olmadığını kontrol et
    if (!fs.existsSync(filePath)) {
        return res.status(400).send('Dosya bulunamadı.');
    }

    // Dosyayı yükleyip MessageMedia objesi oluşturma
    const media = MessageMedia.fromFilePath(filePath);

    // Medya gönderimi
    client.sendMessage(chatId, media).then(response => {
        console.log(`Medya başarıyla gönderildi: ${response.id.id}`);
        res.status(200).send('Medya başarıyla gönderildi.');
    }).catch(err => {
        console.error('Medya gönderilemedi:', err);
        res.status(500).send('Medya gönderilemedi.');
    });
});*/
app.post('/send-media', async (req, res) => {
    const number = req.body.number; // Telefon numarası
    const fileUrl = req.body.fileUrl; // Resim dosyasının URL'si

    const chatId = number + '@c.us'; // Chat ID'yi oluşturuyoruz

    try {
        // Resmi URL'den indir
        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'arraybuffer' // Resmi binary formatında alıyoruz
        });

        // Dosyayı Buffer olarak kullan ve base64'e çevir
        const media = new MessageMedia('image/jpeg', Buffer.from(response.data).toString('base64'));

        // WhatsApp üzerinden resim gönder
        client.sendMessage(chatId, media).then(response => {
            console.log('Resim başarıyla gönderildi:', response.id.id);
            res.status(200).send('Resim başarıyla gönderildi.');
        }).catch(err => {
            console.error('Resim gönderilemedi:', err);
            res.status(500).send('Resim gönderilemedi.');
        });

    } catch (error) {
        console.error('Resim indirme hatası:', error);
        res.status(500).send('Resim indirilemedi.');
    }
});

// URL'den video indirip WhatsApp üzerinden gönderme
app.post('/send-video', async (req, res) => {
    const number = req.body.number; // Telefon numarası
    const fileUrl = req.body.fileUrl; // Video dosyasının URL'si
  
    const chatId = number + '@c.us'; // Chat ID oluşturma
  
    try {
      // Videoyu URL'den indir
      const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'arraybuffer' // Video dosyasını binary formatında alıyoruz
      });
  
      // Dosyayı Buffer olarak kullan ve base64'e çevir
      const media = new MessageMedia('video/mp4', Buffer.from(response.data).toString('base64'));
  
      // WhatsApp üzerinden video gönder
      client.sendMessage(chatId, media).then(response => {
        console.log('Video başarıyla gönderildi:', response.id.id);
        res.status(200).send('Video başarıyla gönderildi.');
      }).catch(err => {
        console.error('Video gönderilemedi:', err);
        res.status(500).send('Video gönderilemedi.');
      });
  
    } catch (error) {
      console.error('Video indirme hatası:', error);
      res.status(500).send('Video indirilemedi.');
    }
  });

// Sunucuyu başlat
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor; port: ${PORT}`);
});

// WhatsApp istemcisini başlat
client.initialize();