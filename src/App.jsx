import React, { useState, useEffect } from "react"; 

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

  // Auto-status berdasarkan tanggal, waktu, dan completed
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

  // Tambah tugas via modal
  const handleAddTaskFromForm = (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.date || !newTask.time) return;

    const taskToAdd = {
      title: newTask.title.trim(),
      description: newTask.description?.trim() || "-",
      date: newTask.date,
      time: newTask.time,
      completed: false,
    };

    //  auto-status live
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
  <img src="konser.png" alt="bg" 
    className="absolute inset-0 w-full h-full object-cover -z-10"
  />

      <header className="absolute top-0 text-xl p-5 bg-[#0929b6] w-full text-center rounded-lg shadow-sm">
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
            <img src="BLADES.png" alt="search" className="w-10 h-10" />
          </button>
        </div>

        <div className="p-6"></div>

        {/* List */}
        <div className="flex justify-center">
          <div className="w-[85%] flex flex-col gap-y-4">
            <p className="font-semibold text-xl">Daftar Jadwal dan Tugas </p>
            <hr />

            {filteredTasks.map((currentTask, index) => {
              const autoStatus = getAutoStatus(currentTask); // auto-status untuk tampilan
              return (
                <div
                  key={index}
                  className={`bg-[#303030] p-4 rounded-2xl shadow-lg flex justify-between items-start gap-4 ${
                    currentTask.completed ? "opacity-80" : ""
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    <input
                      type="checkbox"
                      checked={!!currentTask.completed}
                      onChange={() => handleToggleCompleted(index)}
                      className="mt-1 w-5 h-5"
                      aria-label={`Toggle ${currentTask.title}`}
                    />
                    <div>
                      <p className="text-base">
                        <span
                          className={`text-xl font-semibold ${
                            currentTask.completed ? "line-through" : ""
                          }`}
                        >
                          {currentTask.title}
                        </span>
                        <br />
                        <span className="text-sm block mt-2">
                          {currentTask.description}
                        </span>
                        <span className="text-sm text-gray-300 block mt-2">
                          Date: {currentTask.date}, Time: {currentTask.time}
                        </span>
                        <span className="text-sm text-gray-300 block">
                          {/*  tampilkan auto-status (bukan field status statis) */}
                          Status: {autoStatus}
                        </span>
                      </p>
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
        className="fixed bottom-6 left-6 bg-blue-400 hover:bg-blue-600 text-white text-3xl w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
        aria-label="Tambah jadwal"
        title="Tambah jadwal"
      >
        +
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
                placeholder="Deskripsi"
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
                required
              />
              <input
                type="time"
                value={newTask.time}
                onChange={(e) =>
                  setNewTask({ ...newTask, time: e.target.value })
                }
                className="w-full p-2 rounded bg-gray-700 text-white"
                required
              />
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
                  className="px-4 py-1 bg-blue-500 rounded hover:bg-blue-600"
                >
                  Simpan
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
