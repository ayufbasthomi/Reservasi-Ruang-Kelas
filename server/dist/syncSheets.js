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
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendBookingToSheet = appendBookingToSheet;
exports.deleteBookingFromSheet = deleteBookingFromSheet;
// backend/syncSheets.ts
const googleapis_1 = require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error("GOOGLE_CREDENTIALS environment variable is not set");
}
const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const auth = new googleapis_1.google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: SCOPES,
});
const sheets = googleapis_1.google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = "13H_XvOYjwDskZbh7e-6TQGHw4MWltkHWnJ9bKRCL9Dw"; // ID spreadsheet
// 🔹 Mapping nama ruangan -> nama sheet
const SHEET_MAP = {
    "Ruang Rapat Dirjen": "Ruang Rapat Dirjen",
    "Ruang Rapat Sesditjen": "Ruang Rapat Sesditjen",
    "Command Center": "Command Center",
    "Ruang Rapat Lt2": "Ruang Rapat Lt2",
    "Ballroom": "Ballroom",
};
// Helper untuk dapatkan nama sheet berdasarkan room
function getSheetName(room) {
    // return SHEET_MAP[room] || "Sheet1"; // fallback ke Sheet1 kalau tidak cocok
    return SHEET_MAP[room];
}
// ✅ Tambahkan booking ke Google Sheets
function appendBookingToSheet(bookingData) {
    return __awaiter(this, void 0, void 0, function* () {
        const sheetName = getSheetName(bookingData.room);
        const range = `${sheetName}!A:E`;
        yield sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [
                    [
                        bookingData.room,
                        bookingData.date,
                        bookingData.startTime,
                        bookingData.endTime,
                        bookingData.pic,
                    ],
                ],
            },
        });
        console.log(`✅ Data booking masuk ke sheet "${sheetName}"`);
    });
}
// ✅ Hapus booking dari Google Sheets
function deleteBookingFromSheet(bookingData) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const sheetName = getSheetName(bookingData.room);
        const range = `${sheetName}!A:E`;
        const response = yield sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range,
        });
        const rows = response.data.values || [];
        const normalize = (val) => (val || "").toString().trim();
        const rowIndex = rows.findIndex((row) => {
            const [room, date, startTime, endTime, pic] = row.map((cell) => normalize(cell));
            return (room === normalize(bookingData.room) &&
                date === normalize(bookingData.date) &&
                (startTime === normalize(bookingData.startTime) ||
                    startTime === `${normalize(bookingData.startTime)}:00` ||
                    startTime === normalize(bookingData.startTime).replace(/^0/, "")) &&
                (endTime === normalize(bookingData.endTime) ||
                    endTime === `${normalize(bookingData.endTime)}:00` ||
                    endTime === normalize(bookingData.endTime).replace(/^0/, "")) &&
                pic === normalize(bookingData.pic));
        });
        if (rowIndex === -1) {
            console.log(`⚠️ Data booking tidak ditemukan di sheet "${sheetName}":`, bookingData);
            return;
        }
        // 🔹 Cari sheetId berdasarkan nama sheet
        const sheetInfo = yield sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });
        const sheetMeta = (_a = sheetInfo.data.sheets) === null || _a === void 0 ? void 0 : _a.find((s) => { var _a; return ((_a = s.properties) === null || _a === void 0 ? void 0 : _a.title) === sheetName; });
        if (!((_b = sheetMeta === null || sheetMeta === void 0 ? void 0 : sheetMeta.properties) === null || _b === void 0 ? void 0 : _b.sheetId)) {
            console.error(`❌ Sheet "${sheetName}" tidak ditemukan`);
            return;
        }
        yield sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: sheetMeta.properties.sheetId,
                                dimension: "ROWS",
                                startIndex: rowIndex,
                                endIndex: rowIndex + 1,
                            },
                        },
                    },
                ],
            },
        });
        console.log(`🗑️ Data booking dihapus dari sheet "${sheetName}"`);
    });
}
