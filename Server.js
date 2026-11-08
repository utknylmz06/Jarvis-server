const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

const TOKEN = "9106376405:AAEfw3hrcNLlvEG6cGrpsjzNkdmJg5PSR1g";
const CHAT_ID = "7622505128"; 
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(TOKEN, { polling: true });

// Telegram'dan /sunucu komutu gelirse kasayı gönder
bot.onText(/\/sunucu/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== CHAT_ID) return; 

    try {
        const gecmis = fs.readFileSync('gecmis.txt', 'utf8');
        if (!gecmis) {
            bot.sendMessage(chatId, "Kasa henüz boş efendim.");
            return;
        }
        const parcalar = gecmis.match(/[\s\S]{1,4000}/g);
        parcalar.forEach(parca => {
            bot.sendMessage(chatId, `📂 <b>KASA KAYITLARI:</b>\n<pre>${parca}</pre>`, { parse_mode: 'HTML' });
        });
    } catch (err) {
        bot.sendMessage(chatId, "Kasa dosyası bulunamadı efendim.");
    }
});

// Siteden gelen mesajları kaydet ve Telegram'a at
app.post('/api/log', (req, res) => {
    const { kim, mesaj } = req.body;
    const suan = new Date().toLocaleString('tr-TR');
    const logMetni = `[${suan}] ${kim}: ${mesaj}\n`;

    fs.appendFileSync('gecmis.txt', logMetni, 'utf8');
    let tgMesaj = kim === 'SEN' ? `👤 <b>SEN:</b> ${mesaj}` : `🤖 <b>JARVIS:</b> ${mesaj}`;
    bot.sendMessage(CHAT_ID, tgMesaj, { parse_mode: 'HTML' });

    res.json({ durum: "ok" });
});

// Siteden gelen fotoğrafları Telegram'a at
app.post('/api/foto', (req, res) => {
    const { fotograf } = req.body;
    const resimBuffer = Buffer.from(fotograf.split(",")[1], 'base64');
    
    bot.sendPhoto(CHAT_ID, resimBuffer, { caption: "📸 J.A.R.V.I.S. Kasa Kaydı: Fotoğraf Çekildi." })
        .then(() => res.json({ durum: "basarili" }))
        .catch((err) => res.status(500).json({ durum: "hata", mesaj: err.message }));
});

app.listen(PORT, () => {
    console.log(`J.A.R.V.I.S. Sunucusu ${PORT} portunda çalışıyor...`);
});
