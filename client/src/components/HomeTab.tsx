export default function HomeTab() {
  return (
    <div className="flex justify-center items-start min-h-screen text-black bg-white">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="footer mt-[100px] text-left">
          <p className="font-bold mb-2">Langkah-langkah peminjaman ruangan :</p>
          <ol className="list-decimal list-outside pl-6 space-y-2">
            <li>Klik tab "Pinjam Ruangan Sekarang".</li>
            <li>Pilih ruangan.</li>
            <li>Masukkan tanggal pemakaian ruangan.</li>
            <li>
              Tunggu beberapa saat hingga sistem menampilkan waktu ketersediaan
              ruangan pada kolom yang tersedia, lalu masukkan waktu pemakaian
              ruangan.
            </li>
            <li>Masukkan nama PIC.</li>
            <li>Klik "Kirim Pengajuan".</li>
            <li>
              Tunggu hingga pengajuan peminjaman ruangan diverifikasi
              oleh admin. Pengajuan yang sudah diverifikasi akan tampil di tab
              “Riwayat Peminjaman”.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}