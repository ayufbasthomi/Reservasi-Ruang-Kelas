// src/components/BookingTab.tsx
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

type AvailabilitySlot = { startTime: string; endTime: string };

const API = import.meta.env.VITE_API_BASE_URL;

export default function BookingTab({
  setHistory,
  editingBooking = null,
  onFinishEdit,
}: {
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
  editingBooking?: any | null;
  onFinishEdit?: (updated: any) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");
  const [pic, setPic] = useState<string>("");

  // 🔹 Tambahan: Unit Kerja
  const [unitKerja, setUnitKerja] = useState<string>("");
  const unitOptions = [
    "MM Reguler A",
    "MM Reguler B",
    "MM Non-reguler A",
    "MM Non-reguler B",
  ];

  const rooms: { id: number; name: string; capacity: string; img: string }[] = [
    { id: 1, name: "Ruang Kelas 1", capacity: "50 orang", img: "/gambarsatu.jpg" },
    { id: 2, name: "Ruang Kelas 2", capacity: "50 orang", img: "/gambardua.jpeg" },
    { id: 3, name: "Ruang Kelas 3", capacity: "50 orang", img: "/gambarempat.jpg" },
    { id: 4, name: "Ruang Kelas 4", capacity: "50 orang", img: "/gambarlima.jpg" },
    { id: 5, name: "Ruang Kelas 5", capacity: "50 orang", img: "/gambarenam.jpg" },
  ];

  const bookingData = {
    _id: editingBooking?._id || null,
    room: rooms.find((r) => r.id === selected)?.name || null,
    date: selectedDate || null,
    startTime: timeStart || null,
    endTime: timeEnd || null,
    pic: pic || null,
    unitKerja: unitKerja || null,
  };

  // Helpers time
  const parseToMinutes = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm;
  };
  const formatFromMinutes = (m: number) => {
    const hh = Math.floor(m / 60).toString().padStart(2, "0");
    const mm = (m % 60).toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };

  // Ambil user (PIC)
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.username) setPic(data.username);
        }
      } catch (err) {
        console.error("❌ Error fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  // Isi form kalau sedang edit
  useEffect(() => {
    if (editingBooking) {
      const room = rooms.find((r) => r.name === editingBooking.room);
      if (room) setSelected(room.id);
      setSelectedDate(editingBooking.date || "");
      setTimeStart(editingBooking.startTime || "");
      setTimeEnd(editingBooking.endTime || "");
      setPic(editingBooking.pic || "");
      setUnitKerja(editingBooking.unitKerja || "");
    }
  }, [editingBooking]);

  // ----------------------
  // Fetch availability
  // ----------------------
  useEffect(() => {
    const fetchAvailability = async () => {
      if (bookingData.room && bookingData.date) {
        try {
          const res = await fetch(`${API}/api/check-availability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: bookingData.room, date: bookingData.date }),
          });

          if (!res.ok) {
            setAvailability([]);
            return;
          }

          let slots: AvailabilitySlot[] = [];
          const data = await res.json();
          if (Array.isArray(data.available)) {
            slots = data.available as AvailabilitySlot[];
          }

          // 👉 kalau sedang edit, tambahkan slot lama user lalu gabungkan bila bersebelahan
          if (editingBooking && editingBooking.startTime && editingBooking.endTime) {
            const oldSlot = {
              startTime: editingBooking.startTime,
              endTime: editingBooking.endTime,
            };
            slots.push(oldSlot);

            // 🔹 Gabungkan slot lama dengan slot lain yang berdekatan
            slots = slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
            const merged: AvailabilitySlot[] = [];

            for (const s of slots) {
              if (!merged.length) {
                merged.push(s);
              } else {
                const last = merged[merged.length - 1];
                if (last.endTime === s.startTime) {
                  // Gabungkan slot menempel (contoh: 09:00–12:00 + 12:00–17:00)
                  last.endTime = s.endTime;
                } else {
                  merged.push(s);
                }
              }
            }

            slots = merged;
            console.log("🧩 Final availability slots (merged):", slots);
          }

          // Urutkan biar rapi
          slots.sort((a: AvailabilitySlot, b: AvailabilitySlot) => a.startTime.localeCompare(b.startTime));
          setAvailability(slots);
        } catch (err) {
          console.error("❌ Error fetch availability:", err);
          setAvailability([]);
        }
      } else {
        setAvailability([]);
      }
    };

    fetchAvailability();
  }, [bookingData.room, bookingData.date, editingBooking]);

  // Generate opsi waktu
  const generateStartOptions = (): string[] => {
    if (!availability.length) return [];
    const options: string[] = [];
    availability.forEach((slot: AvailabilitySlot) => {
      const start = parseToMinutes(slot.startTime);
      const end = parseToMinutes(slot.endTime);
      let current = start;
      while (current < end) {
        options.push(formatFromMinutes(current));
        current += 30;
      }
    });
    return Array.from(new Set(options)).sort();
  };

  const generateEndOptions = (): string[] => {
    if (!timeStart || !availability.length) return [];
    const options: string[] = [];
    const startMin = parseToMinutes(timeStart);

    const slot = availability.find((s: AvailabilitySlot) => {
      const sStart = parseToMinutes(s.startTime);
      const sEnd = parseToMinutes(s.endTime);
      return startMin >= sStart && startMin < sEnd;
    });

    if (!slot) return [];
    const slotEndMin = parseToMinutes(slot.endTime);

    let current = startMin + 30;
    while (current <= slotEndMin) {
      options.push(formatFromMinutes(current));
      current += 30;
    }
    return options;
  };

  // Reset otomatis
  useEffect(() => {
    const starts = generateStartOptions();
    if (timeStart && !starts.includes(timeStart)) {
      setTimeStart("");
      setTimeEnd("");
    }
  }, [availability]);

  useEffect(() => {
    if (!timeStart) return;
    const ends = generateEndOptions();
    if (timeEnd && !ends.includes(timeEnd)) {
      setTimeEnd("");
    }
  }, [timeStart, availability]);

  // Simpan / update booking
  const handleSubmit = async () => {
    if (
      !bookingData.room ||
      !bookingData.date ||
      !bookingData.startTime ||
      !bookingData.endTime ||
      !bookingData.pic ||
      !bookingData.unitKerja
    ) {
      alert("⚠️ Mohon lengkapi semua data termasuk Unit Kerja!");
      return;
    }

    const startMinutes = parseToMinutes(bookingData.startTime);
    const endMinutes = parseToMinutes(bookingData.endTime);
    if (endMinutes <= startMinutes) {
      alert("⚠️ Jam selesai harus lebih besar dari jam mulai!");
      return;
    }

    try {
      const endpoint = editingBooking ? `${API}/api/book/${bookingData._id}` : `${API}/api/book`;
      const method = editingBooking ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data.message || "Gagal simpan booking");
      }

      const updatedBooking = {
        _id: data._id || bookingData._id,
        room: data.room || bookingData.room,
        date: data.date || bookingData.date,
        startTime: data.startTime || bookingData.startTime,
        endTime: data.endTime || bookingData.endTime,
        pic: data.pic || bookingData.pic,
        unitKerja: data.unitKerja || bookingData.unitKerja,
      };

      if (editingBooking && onFinishEdit) {
        onFinishEdit(updatedBooking);
        alert("✅ Booking berhasil diperbarui!");
      } else {
        setHistory((prev) => [...prev, updatedBooking]);
        alert("✅ Booking baru berhasil disimpan!");
        setSelected(null);
        setSelectedDate("");
        setTimeStart("");
        setTimeEnd("");
        setUnitKerja("");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(`❌ Error: ${err.message || ""}`, {
        style: { background: "#fee2e2", color: "#b91c1c", fontWeight: "600" },
      });
    }
  };

  // ----------------------
  // JSX
  // ----------------------
  const startOptions = generateStartOptions();
  const endOptions = generateEndOptions();

  return (
    <div className="min-h-screen text-black font-bold bg-white pt-0 px-0">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Ruangan */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`w-full bg-transparent border-2 rounded-xl flex flex-col justify-between items-center p-3 transition
                  ${selected === room.id ? "border-blue-500 shadow-xl" : "border-gray-300 shadow-sm"}`}
              >
                <div className="flex flex-col items-center">
                  <img src={room.img} alt={room.name} className="w-full h-40 object-cover mb-2 rounded-lg" />
                  <p className="text-base text-center">{room.name}</p>
                  <p className="text-sm text-center font-normal mt-0.5">(Kapasitas {room.capacity})</p>
                </div>
                <button
                  onClick={() => setSelected(room.id)}
                  className={`px-4 py-1 rounded-lg mt-3 text-white transition
                    ${selected === room.id ? "bg-blue-700" : "bg-blue-300 hover:bg-blue-700"}`}
                >
                  Pilih
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="w-full lg:w-[350px] p-4 border rounded-lg shadow-md bg-white h-fit lg:ml-auto">
          <div className="mb-4">
            <label className="block text-sm mb-1">Tanggal Pemakaian</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 font-normal bg-white"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1">Jam Kosong Ruangan</label>
            <div className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700 font-normal min-h-[50px]">
              {availability.length > 0 ? (
                <ul className="list-disc list-inside text-sm">
                  {availability.map((slot: AvailabilitySlot, idx: number) => (
                    <li key={idx}>
                      {slot.startTime} - {slot.endTime}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-500 text-sm">
                  {bookingData.room && bookingData.date ? "Tidak ada slot kosong" : "(Pilih ruangan & tanggal dulu)"}
                </span>
              )}
            </div>
          </div>

          {/* Waktu */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Waktu Pemakaian</label>
            <div className="flex items-center gap-2">
              <select
                value={timeStart}
                onChange={(e) => {
                  setTimeStart(e.target.value);
                  setTimeEnd("");
                }}
                className="w-1/2 border rounded-lg px-3 py-2 font-normal bg-white"
              >
                <option value="">Pilih</option>
                {startOptions.map((t: string) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span>-</span>
              <select
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-1/2 border rounded-lg px-3 py-2 font-normal bg-white"
                disabled={!timeStart || endOptions.length === 0}
              >
                <option value="">Pilih</option>
                {endOptions.map((t: string) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PIC */}
          <div className="mb-4">
            <label className="block text-sm mb-1">PIC</label>
            <input
              type="text"
              value={pic}
              readOnly
              className="w-full border rounded-lg px-3 py-2 font-normal bg-gray-100 text-gray-700"
            />
          </div>

          {/* ✅ Unit Kerja */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Kelas</label>
            <select
              value={unitKerja}
              onChange={(e) => setUnitKerja(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 font-normal bg-white"
            >
              <option value="">Pilih Kelas</option>
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-full bg-blue-300 hover:bg-blue-700 text-white font-semibold"
          >
            {editingBooking ? "Simpan Perubahan" : "Kirim Pengajuan"}
          </button>

          <div className="mt-4">
            <Toaster position="top-center" reverseOrder={false} gutter={8} />
          </div>
        </div>
      </div>
    </div>
  );
}
