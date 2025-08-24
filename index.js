import makeWASocket, { useSingleFileAuthState } from "@adiwajshing/baileys";
import qrcode from "qrcode-terminal";
import fs from "fs";
import { config } from "./config.js";
import fetch from "node-fetch";

const { state, saveState } = useSingleFileAuthState("./session/auth_info.json");

const startBot = async () => {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ["Sasuke Bot", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("connection.update", ({ connection, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === "open") {
      console.log(`✅ ${config.botName} is online as ${config.ownerName}`);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text) return;

    const command = text.trim().toLowerCase().split(" ")[0];

    // 📌 MENU
    if (command === ".menu" || command === ".help") {
      let menuMsg = `
╔═══════════════════╗
   
╚═══════════════════╝

*Available Commands:*

🌐 General Commands: .help, .ping, .alive, .tts <text>, .owner, .joke, .quote, .fact, .weather <city>, .news, .lyrics <song>, .groupinfo ...

👮 Admin Commands: .ban, .kick, .mute, .warn, .tagall, .chatbot, .welcome <on/off> ...

🔒 Owner Commands: .mode, .autostatus, .setpp <image>, .autoreact ...

🎨 Image/Sticker: .sticker, .blur, .meme, .emojimix, .take ...

🎮 Games: .tictactoe, .hangman, .truth, .dare ...

🤖 AI: .gpt <q>, .gemini <q>, .imagine <prompt>, .flux <prompt>

🎯 Fun: .compliment, .insult, .flirt, .shayari, .simp ...

🔤 Textmaker: .metallic, .neon, .glitch, .fire, .blackpink ...

📥 Downloader: .play, .song, .ytmp4 <link>, .instagram <link>, .facebook <link> ...

💻 Github: .git, .github, .repo, .script
      `;

      await sock.sendMessage(from, {
        image: fs.readFileSync(config.botImage),
        caption: menuMsg
      });
    }

    // 📌 PING
    if (command === ".ping") {
      await sock.sendMessage(from, { text: "🏓 Pong! Bot is active." });
    }

    // 📌 OWNER INFO
    if (command === ".owner") {
      await sock.sendMessage(from, {
        text: `👑 Owner: ${config.ownerName}\n📞 Numbers: ${config.ownerNumbers.join(", ")}`
      });
    }

    // 📌 AI CHATBOT (.gpt)
    if (command === ".gpt") {
      const question = text.replace(".gpt", "").trim();
      if (!question) return sock.sendMessage(from, { text: "❌ Please ask something after .gpt" });

      try {
        let res = await fetch(`https://api.affiliateplus.xyz/api/chatbot?message=${encodeURIComponent(question)}&botname=${config.botName}&ownername=${config.ownerName}`);
        let data = await res.json();

        await sock.sendMessage(from, { text: `🤖 ${data.message}` });
      } catch (err) {
        await sock.sendMessage(from, { text: "⚠️ AI service is unavailable." });
      }
    }
  });
};

startBot();
