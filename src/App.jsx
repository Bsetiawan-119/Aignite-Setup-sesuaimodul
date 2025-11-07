import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  // Load awal dari localStorage 
  const [tasks, setTasks] = useState(() => {
    try {
      const stored = localStorage.getItem("tasks_v1");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // buat carian
  const [searchQuery, setSearchQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
  });
  const [loadingAI, setLoadingAI] = useState(false);

  // ===== Helper: status otomatis =====
  const getAutoStatus = (task) => {
    try {
      if (!task) return "Active";
      if (task.completed) return "Done";
      if (!task.date || !task.time) return "Active";

      const pad = (n) => String(n).padStart(2, "0");
      const now = new Date();
      const localToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const taskDateTime = new Date(`${task.date}T${task.time}`);

      if (taskDateTime < now) return "Overdue";
      if (task.date === localToday) return "Today";
      return "Upcoming";
    } catch {
      return "Active";
    }
  };

  // Sinkron ke localStorage setiap tasks berubah
  useEffect(() => {
    try {
      localStorage.setItem("tasks_v1", JSON.stringify(tasks));
    } catch (e) {
      console.warn("Gagal menyimpan ke localStorage:", e);
    }
  }, [tasks]);

  async function smartExtractDateTime(naturalText) {
    const prompt = `
Kamu adalah "Schedule" yang sangat ketat.
Tugas: ekstrak TANGGAL dan WAKTU dari teks bebas (Indonesia atau Inggris).

WAJIB Output:
{"date":"YYYY-MM-DD", "time":"HH:MM"}

Aturan:
1) Hanya keluarkan JSON VALID persis seperti di atas (tanpa penjelasan, tanpa backticks).
2) Normalisasi waktu ke 24 jam (HH:MM). Contoh: 5 PM → 17:00, 07.30 → 07:30.
3) Jika tanggal ATAU waktu TIDAK disebutkan JELAS, isi dengan string kosong "" (jangan menebak).
4) Abaikan konteks yang tidak relevan (alamat, nomor telp, harga).
5) Jika ada BANYAK waktu/tanggal, pilih yang paling JELAS terkait acara utama (meeting/due/presentasi). Jika tetap ambigu, pilih yang pertama muncul.
6) Istilah Indonesia:
   - "pagi" ≈ AM, "siang/sore/malam" ≈ PM HANYA berlaku jika jam sudah disebutkan.
   - Jika HANYA ada kata "pagi/siang/sore/malam" TANPA jam → time = "" (jangan tebak jam default).
7) Istilah relatif ("nanti", "sebentar lagi", "minggu depan", "besok") TANPA tanggal pasti → date = "".
8) Format tanggal apa pun (DD/MM/YYYY, 12-10-2025, 10 Oct 2025) harus dinormalisasi ke YYYY-MM-DD.
9) Gunakan bahasa apa pun (ID/EN) tetapi output tetap JSON di atas.
10) Jangan sertakan spasi ekstra, komentar, atau field lain di luar schema.

Contoh:
- "Meeting Jumat 5 PM" → {"date":"", "time":"17:00"}
- "Assignment due 12/10/2025 07:30" → {"date":"2025-10-12", "time":"07:30"}
- "Presentasi besok pagi" → {"date":"", "time":""}
- "Rapat 13.00 siang" → {"date":"", "time":"13:00"}

Teks: """${naturalText}"""
`;

    try {
      setLoadingAI(true);

      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.REACT_APP_GEMINI_API_KEY,
          },
          timeout: 15000, // biar gak ngegantung lama
        }
      );

      const text =
        response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      // Coba parse JSON dari jawaban model
      let parsed = { date: "", time: "" };
      try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { date: "", time: "" };
      }
      const norm = {
        date: (parsed.date || "").slice(0, 10), 
        time: (parsed.time || "").slice(0, 5),  
      };
      return norm;
    } finally {
      setLoadingAI(false);
    }
  }

  // Tambah tugas via modal
  const handleAddTaskFromForm = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;

    let date = newTask.date?.trim();
    let time = newTask.time?.trim();

    // Jika user belum isi tanggal/waktu, coba minta Gemini ekstrak dari judul/desc
    if (!date || !time) {
      const naturalText = `${newTask.title}. ${newTask.description || ""}`.trim();
      const ai = await smartExtractDateTime(naturalText);
      if (!date) date = ai.date || "";
      if (!time) time = ai.time || "";
    }

    const taskToAdd = {
      title: newTask.title.trim(),
      description: newTask.description?.trim() || "-",
      date: date || "",   // bisa kosong jika AI tak yakin
      time: time || "",   // bisa kosong jika AI tak yakin
      completed: false,
    };

    const withStatus = { ...taskToAdd, status: getAutoStatus(taskToAdd) };

    setTasks((prev) => [...prev, withStatus]);
    setNewTask({ title: "", description: "", date: "", time: "" });
    setShowForm(false);
  };

  const handleKeyDownTitle = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setShowForm(true);
    }
  };

  const handleToggleCompleted = (index) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === index ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleRemoveTask = (index) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredTasks = tasks.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative w-full min-h-screen flex justify-center text-white">
      <img src="BGFIX1.png" alt="bg" 
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />

      <header className="absolute top-0 text-xl p-5 bg-[#154aac] w-full text-center rounded-lg shadow-sm">
        Semangat dan sukses App
      </header>

      <main className="pt-36 w-3/4">
        {/* Search bar */}
        <div className="flex justify-center gap-3">
          <input
            className="bg-[#303030] p-4 rounded-2xl w-3/4 shadow-md text-white placeholder:text-gray-400"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDownTitle}
          />
          <button
            className="pl-2 h-12 pt-2 scale-95"
            aria-label="Search"
            title="Search"
            disabled
            style={{ opacity: 0.3, cursor: "not-allowed" }}
          >
            <img src="BLADES3.png" alt="search" className="w-10 h-10" />
          </button>
        </div>

        <div className="p-6"></div>

        {/* List */}
        <div className="flex justify-center">
          <div className="w-[85%] flex flex-col gap-y-4">
            <p className="font-semibold text-xl">Daftar Jadwal dan Tugas </p>
            <hr />

           {filteredTasks.map((currentTask, index) => {
  const autoStatus = getAutoStatus(currentTask);
  return (
    <div
      key={index}
      className={`mt-2 rounded-2xl shadow-lg overflow-hidden border-4 border-yellow-500 ${
        currentTask.completed ? "opacity-80" : ""
      }`}
    >
      {/* BAGIAN ATAS  */}
      <div className="bg-[#0396c7] px-4 py-3">
        <span
          className={`text-xl font-semibold text-white ${
            currentTask.completed ? "line-through" : ""
          }`}
        >
          {currentTask.title}
        </span>
      </div>

      {/* BAGIAN BAWAH L */}
      <div className="bg-[#303030] p-4 flex justify-between items-start gap-4">
        <div className="flex gap-4 items-start">
          <input
            type="checkbox"
            checked={!!currentTask.completed}
            onChange={() => handleToggleCompleted(index)}
            className="mt-1 w-5 h-5"
            aria-label={`Toggle ${currentTask.title}`}
          />
          <div>
            <p className="text-sm mt-2">{currentTask.description}</p>
            <p className="text-sm text-gray-300 mt-2">
              Date: {currentTask.date || "-"}, Time: {currentTask.time || "-"}
            </p>
            <p className="text-sm text-gray-300">Status: {autoStatus}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => handleRemoveTask(index)}
            className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition text-sm"
          >
            Delete
          </button>
          <button
            onClick={() => handleToggleCompleted(index)}
            className="bg-blue-500 px-3 py-1 rounded hover:bg-blue-900 transition text-sm"
          >
            {currentTask.completed ? "Undo" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
})}

            {filteredTasks.length === 0 && (
              <p className="text-center text-gray-400">
                Tidak ada tugas yang cocok dengan pencarian.
              </p>
            )}
          </div>
        </div>
      </main>

      {/* tombol */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-7 right-7 bg-blue-400 hover:bg-blue-600 text-white text-3xl w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
        aria-label="Tambah jadwal"
        title="Tambah jadwal"
      >
        {loadingAI ? "…" : "+"}
      </button>

      {/*   Form Tambah Tugas */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-[#1f2e43] p-6 rounded-xl w-96">
            <h2 className="text-lg font-semibold mb-4">Tambah Tugas</h2>
            <form onSubmit={handleAddTaskFromForm} className="space-y-3">
              <input
                type="text"
                placeholder="Judul"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="w-full p-2 rounded bg-gray-700 text-white"
                required
              />
              <textarea
                placeholder="Deskripsi (opsional / optional)"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
              <input
                type="date"
                value={newTask.date}
                onChange={(e) =>
                  setNewTask({ ...newTask, date: e.target.value })
                }
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
              <input
                type="time"
                value={newTask.time}
                onChange={(e) =>
                  setNewTask({ ...newTask, time: e.target.value })
                }
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
              <p className="text-xs text-gray-300">
                Tip: Kalau tanggal/waktu kosong nanti ke isi sendiri kalau deskripsi/judulnya mengandung info waktu.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-1 bg-gray-500 rounded hover:bg-gray-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-60"
                  disabled={loadingAI}
                >
                  {loadingAI ? "Memproses..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
