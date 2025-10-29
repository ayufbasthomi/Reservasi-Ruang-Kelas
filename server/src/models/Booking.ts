import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking {
  room: string;
  date: string;      // format YYYY-MM-DD
  startTime: string; // format HH:mm
  endTime: string;   // format HH:mm
  pic: string;
  unitKerja: string; // ✅ tambahan field baru
  createdAt?: Date;
  updatedAt?: Date;
}

// Gunakan type Document terpisah (jangan extend)
export type BookingDocument = Document & IBooking;

const BookingSchema = new Schema<BookingDocument>(
  {
    room: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    pic: { type: String, required: true, trim: true },
    unitKerja: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Index dan validasi
BookingSchema.index({ room: 1, date: 1 });
BookingSchema.index({ room: 1, date: 1, startTime: 1, endTime: 1 }, { unique: true });

BookingSchema.pre("save", function (next) {
  const booking = this as BookingDocument;
  if (booking.startTime >= booking.endTime) {
    return next(new Error("End time harus lebih besar dari start time"));
  }
  next();
});

// Export model
export default mongoose.model<BookingDocument>("Booking", BookingSchema);
