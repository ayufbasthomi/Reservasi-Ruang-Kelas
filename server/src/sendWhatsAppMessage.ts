// backend/sendWhatsAppMessage.ts
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const FONNTE_API_URL = "https://api.fonnte.com/send";
const FONNTE_API_KEY = process.env.FONNTE_API_KEY || "";

/**
 * Mengirim pesan WhatsApp menggunakan Fonnte API
 * @param to Nomor tujuan (gunakan format internasional, contoh: 628123456789)
 * @param message Isi pesan yang ingin dikirim
 */
export async function sendWhatsAppMessage(to: string, message: string) {
  if (!FONNTE_API_KEY) {
    console.error("❌ FONNTE_API_KEY belum diset di .env");
    return;
  }

  if (!to || !message) {
    console.error("❌ Nomor tujuan atau pesan kosong");
    return;
  }

  try {
    const response = await axios.post(
      FONNTE_API_URL,
      {
        target: to,
        message,
      },
      {
        headers: {
          Authorization: FONNTE_API_KEY,
        },
        timeout: 10000, // ⏱️ Timeout agar tidak menggantung
      }
    );

    // ✅ Log singkat agar mudah dipantau
    if (response.data.status === true || response.data.status === "true") {
      console.log(`✅ WhatsApp terkirim ke ${to}`);
    } else {
      console.warn("⚠️ WA terkirim tapi respons tidak sukses:", response.data);
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Gagal kirim WA:", error.response?.data || error.message);
    } else {
      console.error("❌ Error tidak terduga saat kirim WA:", error);
    }
  }
}
