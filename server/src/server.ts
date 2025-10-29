import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { connectDB } from "./db";
import Booking from "./models/Booking";
import { appendBookingToSheet, deleteBookingFromSheet } from "./syncSheets";
import authRoutes from "./routes/auth";
import jwt from "jsonwebtoken";
import User from "./models/User";
import { sendWhatsAppMessage } from "./sendWhatsAppMessage";

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || "your_secret_key";

app.use(cors());
app.use(bodyParser.json());

// ✅ Connect ke MongoDB
connectDB();

app.use("/api/auth", authRoutes);

// ✅ Endpoint: Cek ketersediaan
app.post("/api/check-availability", async (req: Request, res: Response) => {
  const { room, date } = req.body;
  if (!room || !date) {
    return res.status(400).json({ error: "Room dan date wajib diisi" });
  }

  const roomBookings = await Booking.find({ room, date });
  const WORKING_HOURS = [{ startTime: "07:30", endTime: "17:00" }];

  let availableSlots = [...WORKING_HOURS];

  roomBookings.forEach((booked: any) => {
    availableSlots = availableSlots.flatMap((slot) => {
      if (booked.startTime >= slot.endTime || booked.endTime <= slot.startTime) {
        return [slot];
      }
      const result: { startTime: string; endTime: string }[] = [];
      if (booked.startTime > slot.startTime) {
        result.push({ startTime: slot.startTime, endTime: booked.startTime });
      }
      if (booked.endTime < slot.endTime) {
        result.push({ startTime: booked.endTime, endTime: slot.endTime });
      }
      return result;
    });
  });

  res.json({ room, date, available: availableSlots });
});

// ✅ Endpoint: Buat booking baru
app.post("/api/book", async (req: Request, res: Response) => {
  const { room, date, startTime, endTime, pic, unitKerja } = req.body;
  console.log("📦 Data diterima di backend:", req.body);

  if (!room || !date || !startTime || !endTime || !pic || !unitKerja) {
    return res.status(400).json({
      success: false,
      message: "Data booking tidak lengkap (termasuk unit kerja)",
    });
  }

  try {
    // 🔹 Cek overlap
    const conflict = await Booking.findOne({
      room,
      date,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "⚠️ Ruangan ini sudah dibooking pada tanggal dan jam yang sama",
      });
    }

    const newBooking = new Booking({
      room,
      date,
      startTime,
      endTime,
      pic,
      unitKerja,
    });
    await newBooking.save();

    try {
      await appendBookingToSheet({ room, date, startTime, endTime, pic, unitKerja });
    } catch (err) {
      console.error("⚠️ Gagal sinkron ke Google Sheets:", err);
    }

    // ✅ Notif WA
    const msg = `📢 Booking Baru!
🏢 ${room}
📅 ${date}
⏰ ${startTime} - ${endTime}
👤 ${pic}
🏬 Unit Kerja: ${unitKerja}`;
    await sendWhatsAppMessage("6281335382726", msg);

    res.json({ success: true, message: "Booking berhasil dibuat", ...newBooking.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal simpan booking" });
  }
});

// ✅ Endpoint: Update booking
app.put("/api/book/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { room, date, startTime, endTime, pic, unitKerja } = req.body;

  if (!room || !date || !startTime || !endTime || !pic || !unitKerja) {
    return res.status(400).json({
      success: false,
      message: "Data booking tidak lengkap (termasuk unit kerja)",
    });
  }

  try {
    const oldBooking = await Booking.findById(id);
    if (!oldBooking) {
      return res.status(404).json({ success: false, message: "Booking tidak ditemukan" });
    }

    // 🔹 Cek overlap dengan booking lain
    const conflict = await Booking.findOne({
      _id: { $ne: id },
      room,
      date,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "⚠️ Ruangan ini sudah dibooking pada tanggal dan jam yang sama",
      });
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      { room, date, startTime, endTime, pic, unitKerja },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Booking tidak ditemukan" });
    }

    // 🔹 Sinkronisasi ke Google Sheets
    try {
      await deleteBookingFromSheet({
        room: oldBooking.room,
        date: oldBooking.date,
        startTime: oldBooking.startTime,
        endTime: oldBooking.endTime,
        pic: oldBooking.pic,
        unitKerja: oldBooking.unitKerja,
      });
      await appendBookingToSheet({
        room: updated.room,
        date: updated.date,
        startTime: updated.startTime,
        endTime: updated.endTime,
        pic: updated.pic,
        unitKerja: updated.unitKerja,
      });
    } catch (err) {
      console.error("⚠️ Gagal sinkron update ke Google Sheets:", err);
    }

    // ✅ Notif WA
    const msg = `✏️ Booking Diperbarui!
🏢 ${room}
📅 ${date}
⏰ ${startTime} - ${endTime}
👤 ${pic}
🏬 Unit Kerja: ${unitKerja}`;
    await sendWhatsAppMessage("6281335382726", msg);

    res.json({ success: true, message: "Booking berhasil diupdate", ...updated.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal update booking" });
  }
});

// ✅ Endpoint: Batalkan booking
app.post("/api/cancel-booking", async (req: Request, res: Response) => {
  const { room, date, startTime, endTime, pic, unitKerja } = req.body;

  try {
    const booking = await Booking.findOne({ room, date, startTime, endTime, pic, unitKerja });
    if (!booking) {
      return res.json({ success: false, message: "Booking tidak ditemukan" });
    }

    await Booking.deleteOne({ _id: booking._id });

    try {
      await deleteBookingFromSheet({
        room: booking.room,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        pic: booking.pic,
        unitKerja: booking.unitKerja,
      });
    } catch (err) {
      console.error("⚠️ Gagal hapus dari Google Sheets:", err);
    }

    // ✅ Notif WA
    const msg = `❌ Booking Dibatalkan!
🏢 ${booking.room}
📅 ${booking.date}
⏰ ${booking.startTime} - ${booking.endTime}
👤 ${booking.pic}
🏬 Unit Kerja: ${booking.unitKerja}`;
    await sendWhatsAppMessage("6281335382726", msg);

    res.json({ success: true, message: "Booking berhasil dibatalkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal membatalkan booking" });
  }
});

// ✅ Endpoint: Semua booking
app.get("/api/bookings", async (_req: Request, res: Response) => {
  const allBookings = await Booking.find();
  res.json(allBookings);
});

// ✅ Endpoint: Booking user login
app.get("/api/my-bookings", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, SECRET) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const bookings = await Booking.find({ pic: user.username }).sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Root
app.get("/", (_req: Request, res: Response) => {
  res.send("✅ API running...");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
