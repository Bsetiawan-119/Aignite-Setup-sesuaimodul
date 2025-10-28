import React, { useState, useEffect } from "react";

function App() {
  const task1 = {
    title: "Kelas Matematika",
    description: "Mempelajari tentang aljabar, geometri, dan kalkulus",
    date: "30 Februari 2025",
    time: "09.00 AM",
    status: "Active",
    completed: false,
  };

  const task2 = {
    title: "Belajar Bahasa Inggris",
    description: "Mempelajari tentang grammar, vocabulary, dan speaking",
    date: "15 Maret 2025",
    time: "10.00 AM",
    status: "Active",
    completed: false,
  };

  // --- load dari localStorage bila ada, kalau tidak gunakan task1 & task2 ---
  const [tasks, setTasks] = useState(() => {
    try {
      const stored = localStorage.getItem("tasks_v1");
      return stored ? JSON.parse(stored) : [task1, task2];
    } catch {
      return [task1, task2];
    }
  });

  // input state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // simpan ke localStorage tiap kali tasks berubah
  useEffect(() => {
    try {
      localStorage.setItem("tasks_v1", JSON.stringify(tasks));
    } catch (e) {
      console.warn("Gagal menyimpan ke localStorage:", e);
    }
  }, [tasks]);

  const handleAddTask = () => {
    if (newTitle.trim() === "") return; 

    const now = new Date();
    const taskToAdd = {
      title: newTitle,
      description: newDescription || "-",
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "Active",
      completed: false,
    };

    setTasks((prev) => [...prev, taskToAdd]);
    setNewTitle("");
    setNewDescription("");
  };

  const handleKeyDownTitle = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask();
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

  return (
    <div className="flex justify-center w-full min-h-screen bg-[#212121] text-white">
      <header className="absolute top-0 text-xl p-5 bg-[#303030] w-full text-center rounded-lg shadow-sm">
        To-Do The List App
      </header>

      <main className="pt-36 w-3/4">
        {/* Inputnya */}
        <div className="flex justify-center gap-3">
          <input
            className="bg-[#303030] p-4 rounded-2xl w-2/3 shadow-md text-white placeholder:text-gray-400"
            placeholder="Type Your List (title)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDownTitle}
          />

          {/* optional description input */}
          <input
            className="bg-[#303030] p-4 rounded-2xl w-1/4 shadow-md text-white placeholder:text-gray-400"
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTask();
              }
            }}
          />

          <button
            onClick={handleAddTask}
            className="pl-2 h-12 pt-2 scale-95"
            aria-label="Add Task"
            title="Add Task"
          >
            {/* buat taro logo*/}
            <img src="logo192.png" alt="enter" className="w-10 h-10" />
          </button>
        </div>

        {/* Spacing */}
        <div className="p-6" />

        {/* To-Do The List */}
        <div className="flex justify-center">
          <div className="w-[85%] flex flex-col gap-y-4">
            <p className="font-semibold text-xl">Your To-Do List</p>
            <hr />

            {tasks.map((currentTask, index) => (
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
                        Status: {currentTask.status}
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
            ))}

            {tasks.length === 0 && (
              <p className="text-center text-gray-400">
                alhadulillah gak ada tugas 
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
