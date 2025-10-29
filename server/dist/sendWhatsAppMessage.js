"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppMessage = sendWhatsAppMessage;
// backend/sendWhatsAppMessage.ts
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const FONNTE_API_URL = "https://api.fonnte.com/send";
const FONNTE_API_KEY = process.env.FONNTE_API_KEY || "";
/**
 * Mengirim pesan WhatsApp menggunakan Fonnte API
 * @param to Nomor tujuan (gunakan format internasional, contoh: 628123456789)
 * @param message Isi pesan yang ingin dikirim
 */
function sendWhatsAppMessage(to, message) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!FONNTE_API_KEY) {
            console.error("❌ FONNTE_API_KEY belum diset di .env");
            return;
        }
        if (!to || !message) {
            console.error("❌ Nomor tujuan atau pesan kosong");
            return;
        }
        try {
            const response = yield axios_1.default.post(FONNTE_API_URL, {
                target: to,
                message,
            }, {
                headers: {
                    Authorization: FONNTE_API_KEY,
                },
                timeout: 10000, // ⏱️ Timeout agar tidak menggantung
            });
            // ✅ Log singkat agar mudah dipantau
            if (response.data.status === true || response.data.status === "true") {
                console.log(`✅ WhatsApp terkirim ke ${to}`);
            }
            else {
                console.warn("⚠️ WA terkirim tapi respons tidak sukses:", response.data);
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error("❌ Gagal kirim WA:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            }
            else {
                console.error("❌ Error tidak terduga saat kirim WA:", error);
            }
        }
    });
}
