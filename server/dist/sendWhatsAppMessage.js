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
// server/src/sendWhatsAppMessage.ts
const axios_1 = __importDefault(require("axios"));
const FONNTE_API_URL = "https://api.fonnte.com/send";
function sendWhatsAppMessage(to, message) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // 🔑 Cek token dari .env
            // console.log("🔑 Token dipakai:", process.env.FONNTE_API_KEY);
            const res = yield axios_1.default.post(FONNTE_API_URL, {
                target: to,
                message: message,
            }, {
                headers: {
                    Authorization: process.env.FONNTE_API_KEY || "",
                },
            });
            // console.log(`✅ WA request ke ${to}: ${message}`);
            // console.log("📩 Response Fonnte:", res.data);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error("❌ Gagal kirim WA:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            }
            else {
                console.error("❌ Error tidak terduga:", error);
            }
        }
    });
}
