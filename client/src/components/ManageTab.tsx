// src/components/ManageTab.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { LogOut } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function ManageTab() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // ✅ Fetch data user dari backend
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("⚠️ Token tidak ditemukan di localStorage");
        return;
      }

      try {
        console.log("🔎 Fetching user with token:", token);

        const res = await axios.get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("✅ User fetched:", res.data);

        // Ambil data user
        const fetchedUser = (res.data as any).user || res.data;

        setUsername(fetchedUser.username || "");
        setEmail(fetchedUser.email || "");
      } catch (err: any) {
        console.error(
          "❌ Failed to fetch user:",
          err.response?.data || err.message
        );
      }
    };
    fetchUser();
  }, []);

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    console.log("👋 User logged out, token dihapus");
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6 bg-white text-black">
      <h1 className="text-2xl font-bold mb-6">Profil</h1>

      <div className="w-full max-w-md space-y-4">
        <div>
          <label className="block mb-1 font-medium">Username</label>
          <input
            type="text"
            value={username}
            readOnly
            className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2 flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg font-semibold"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}
