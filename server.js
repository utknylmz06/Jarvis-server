const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// Şifreler artık Render'ın kasasından okunacak
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID; 
const PORT = process.env.PORT || 3000;

// ŞİFRE AYARI BURADA KANKA
const KASA_SIFRESI = "Utkan9292"; 
let sifreBekleniyor = false; // Botun şifre bekleyip beklemediğini tutar

const bot = new TelegramBot(TOKEN, { polling: true });

// --- TELEGRAM MESAJLARINI DİNLE ---
bot.on('message', (msg) => {
    const chatId = msg.chat.id.toString();
    const text = msg.text || "";

    // Sadece senin mesajlarını dinle
    if (chatId !== CHAT_ID) return;

    // 1. DURUM: /sunucu yazıldıysa şifre iste
    if (text === '/sunucu') {
        sifreBekleniyor = true;
        bot.sendMessage(chatId, "🔒 Lütfen kasa şifresini girin:");
        return;
    }

    // 2. DURUM: Şifre bekleniyorsa kontrol et
    if (sifreBekleniyor) {
        if (text === KASA_SIFRESI) {
            sifreBekleniyor = false; // Şifre doğru, beklemeyi bitir
            
            try {
                const gecmis = fs.readFileSync('gecmis.txt', 'utf8');
                if (!gecmis) {
                    bot.sendMessage(chatId, "Kasa henüz boş efendim.");
                    return;
                }
                // Mesajı 4000 karakterlik parçalara böl
                const parcalar = gecmis.match(/[\s\S]{1,4000}/g);
                parcalar.forEach(parca => {
                    bot.sendMessage(chatId, `📂 <b>KASA KAYITLARI:</b>\n<pre>${parca}</pre>`, { parse_mode: 'HTML' });
                });
            } catch (err) {
                bot.sendMessage(chatId, "Kasa dosyası bulunamadı efendim.");
            }
        } else {
            sifreBekleniyor = false; // Yanlış şifre
            bot.sendMessage(chatId, "❌ Hatalı şifre! Erişim reddedildi.");
        }
        return;
    }
});

// --- SİTEDEN GELEN MESAJLARI KAYDET VE TELEGRAMA AT ---
app.post('/api/log', (req, res) => {
    const { kim, mesaj } = req.body;
    const suan = new Date().toLocaleString('tr-TR');
    const logMetni = `[${suan}] ${kim}: ${mesaj}\n`;

    fs.appendFileSync('gecmis.txt', logMetni, 'utf8');
    
    // Site çalışırken sohbeti Telegram'a anlık at (İstersen burayı silebiliriz ama anlık görmek iyidir)
    let tgMesaj = kim === 'SEN' ? `👤 <b>SEN:</b> ${mesaj}` : `🤖 <b>JARVIS:</b> ${mesaj}`;
    bot.sendMessage(CHAT_ID, tgMesaj, { parse_mode: 'HTML' });

    res.json({ durum: "ok" });
});

// --- SİTEDEN GELEN FOTOĞRAFLARI TELEGRAMA AT ---
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
