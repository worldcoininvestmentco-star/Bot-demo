import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import P from "pino";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        startBot();
      }
    } else if (connection === "open") {
      console.log("✅ Lucky Tech Hub Bot Connected");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const from = msg.key.remoteJid;
    const command = text.trim().toLowerCase();

    let reply = "";

    if (command === "hi") {
      reply =
`👋 Hello!
Welcome to *Lucky Tech Hub*

Type *menu* to see available options.`;
    }

    else if (command === "menu") {
      reply =
`📋 *Lucky Tech Hub Menu*

1️⃣ About Us
2️⃣ Pricing
3️⃣ Contact Support

Type *help* for assistance.`;
    }

    else if (command === "help") {
      reply =
`ℹ️ *Help Center*

This is an automated WhatsApp bot developed by *Lucky Tech Hub*.

📞 Support: WhatsApp this number
🌍 Services: WhatsApp automation, bots & testing`;
    }

    else {
      reply =
`❌ Unknown command.

Available commands:
• hi
• menu
• help`;
    }

    await sock.sendMessage(from, { text: reply });
  });
}

startBot();
