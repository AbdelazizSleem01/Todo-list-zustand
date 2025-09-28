"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTodoStore, Priority } from "./store/useTodoStore";
import {
  ClipboardList,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Circle,
  CheckCircle2,
  Filter,
  Search,
  Calendar,
  Flag,
  Sun,
  Moon,
  Trash,
  AlertCircle,
  Clock,
  BarChart3,
  Loader2,
  LogOut,
  LogIn,
  Bell,
  BellOff,
  User,
  DatabaseBackup,
} from "lucide-react";

const priorityConfig = {
  low: {
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    label: "Low",
  },
  medium: {
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    label: "Medium",
  },
  high: {
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    label: "High",
  },
};

const getPriorityConfig = (priority: Priority | undefined) => {
  const safePriority = priority || "medium";
  return priorityConfig[safePriority] || priorityConfig.medium;
};

// خدمة الإشعارات
class NotificationService {
  static async requestPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }

  static showNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/icon.png",
        badge: "/icon.png",
        ...options,
      });
    }
  }

  static showDueDateReminder(todoText: string, dueDate: string) {
    this.showNotification("Task Due Soon!", {
      body: `"${todoText}" is due on ${new Date(dueDate).toLocaleDateString()}`,
      tag: "due-date-reminder",
    });
  }

  static showOverdueTask(todoText: string) {
    this.showNotification("Task Overdue!", {
      body: `"${todoText}" is overdue!`,
      tag: "overdue-task",
    });
  }
}

const useNotifications = () => {
  const { todos } = useTodoStore();

  const checkDueDates = useCallback(() => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    todos.forEach((todo) => {
      if (!todo.completed && todo.dueDate) {
        const dueDate = new Date(todo.dueDate);

        if (dueDate < now) {
          NotificationService.showOverdueTask(todo.text);
        } else if (dueDate <= oneHourFromNow) {
          NotificationService.showDueDateReminder(todo.text, todo.dueDate);
        } else if (dueDate <= oneDayFromNow) {
          NotificationService.showDueDateReminder(todo.text, todo.dueDate);
        }
      }
    });
  }, [todos]);

  useEffect(() => {
    NotificationService.requestPermission();
    const interval = setInterval(checkDueDates, 60000);
    checkDueDates();

    return () => clearInterval(interval);
  }, [checkDueDates]);
  return { checkDueDates };
};

export default function Home() {
  const { data: session, status } = useSession();
  const {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    removeTodo,
    updateTodo,
    clearCompleted,
    fetchTodos,
    syncTodos,
    reorderTodos,
  } = useTodoStore();

  useNotifications();

  const [newTodo, setNewTodo] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [darkMode, setDarkMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTodos();

      const syncInterval = setInterval(async () => {
        setSyncing(true);
        await syncTodos();
        setSyncing(false);
      }, 30000);

      return () => clearInterval(syncInterval);
    }
  }, [session, fetchTodos, syncTodos]);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleEnableNotifications = async () => {
    const enabled = await NotificationService.requestPermission();
    setNotificationsEnabled(enabled);
  };

  const handleAddTodo = () => {
    if (newTodo.trim() === "") return;
    addTodo(newTodo, dueDate, priority);
    setNewTodo("");
    setDueDate("");
    setPriority("medium");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTodo();
    }
  };

  const handleEditSave = (id: string) => {
    if (editingText.trim() !== "") {
      updateTodo(id, { text: editingText });
    }
    setEditingTodoId(null);
    setEditingText("");
  };

  const handleManualSync = async () => {
    setSyncing(true);
    await syncTodos();
    setSyncing(false);
  };

  const filteredTodos = todos
    .filter((todo) => {
      if (filter === "active") return !todo.completed;
      if (filter === "completed") return todo.completed;
      return true;
    })
    .filter((todo) =>
      todo.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const overdueTodos = todos.filter(
    (todo) =>
      !todo.completed && todo.dueDate && new Date(todo.dueDate) < new Date()
  );

  const stats = {
    total: todos.length,
    active: todos.filter((todo) => !todo.completed).length,
    completed: todos.filter((todo) => todo.completed).length,
    overdue: overdueTodos.length,
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== dropIndex) {
      reorderTodos(dragIndex, dropIndex);
    }
    setDragIndex(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if date is overdue
  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  // Format date for input field
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  return (
    <main
      className={`min-h-screen transition-colors ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-br from-blue-50 to-indigo-100"
      } py-8 px-4`}
    >
      {/* Loading Indicator */}
      {loading && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 z-50">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      )}

      {/* Syncing Indicator */}
      {syncing && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 z-50">
          <DatabaseBackup className="w-4 h-4 animate-spin" />
          <span>Syncing...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-50 max-w-md text-center">
          {error}
          <button onClick={() => fetchTodos()} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      <div
        className={`max-w-2xl mx-auto rounded-2xl shadow-lg overflow-hidden transition-colors ${
          darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}
      >
        {/* Header مع معلومات المستخدم */}
        <div
          className={`p-6 ${
            darkMode
              ? "bg-gradient-to-r from-gray-800 to-gray-700"
              : "bg-gradient-to-r from-blue-600 to-indigo-700"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  darkMode ? "bg-gray-700" : "bg-white/20"
                }`}
              >
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Todo List</h1>
                {session?.user && (
                  <p className="text-blue-100 text-sm flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Welcome, {session.user.name || session.user.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* زر المزامنة اليدوية */}
              {session?.user && (
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className={`p-2 rounded-lg ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-white/20 hover:bg-white/30"
                  } transition-colors ${
                    syncing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  title="Sync now"
                >
                  <DatabaseBackup
                    className={`w-5 h-5 text-white ${
                      syncing ? "animate-spin" : ""
                    }`}
                  />
                </button>
              )}

              {/* زر الإشعارات */}
              <button
                onClick={handleEnableNotifications}
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-white/20 hover:bg-white/30"
                } transition-colors`}
                title={
                  notificationsEnabled
                    ? "Notifications enabled"
                    : "Enable notifications"
                }
              >
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-white" />
                ) : (
                  <BellOff className="w-5 h-5 text-white" />
                )}
              </button>

              {/* زر Dark Mode */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-white/20 hover:bg-white/30"
                } transition-colors`}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-white" />
                ) : (
                  <Moon className="w-5 h-5 text-white" />
                )}
              </button>

              {/* زر تسجيل الدخول/الخروج */}
              {status === "loading" ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : session?.user ? (
                <button
                  onClick={() => signOut()}
                  className={`p-2 rounded-lg ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-white/20 hover:bg-white/30"
                  } transition-colors`}
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5 text-white" />
                </button>
              ) : (
                <button
                  onClick={() => signIn()}
                  className={`p-2 rounded-lg ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-white/20 hover:bg-white/30"
                  } transition-colors`}
                  title="Sign in"
                >
                  <LogIn className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          <p
            className={`text-center ${
              darkMode ? "text-gray-300" : "text-blue-100"
            }`}
          >
            {session?.user
              ? "Your tasks are synced across all devices"
              : "Sign in to sync your tasks across devices"}
          </p>
        </div>

        {/* رسالة تسجيل الدخول */}
        {!session?.user && status !== "loading" && (
          <div
            className={`p-4 text-center ${
              darkMode ? "bg-gray-700" : "bg-blue-50"
            }`}
          >
            <p className={darkMode ? "text-gray-300" : "text-blue-700"}>
              <button
                onClick={() => signIn()}
                className="underline font-medium"
              >
                Sign in
              </button>{" "}
              to sync your tasks across all your devices
            </p>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "border-gray-300"
              }`}
            />
          </div>
        </div>

        {/* Input Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-3 mb-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What needs to be done?"
                className={`w-full px-4 py-3 pl-11 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300"
                }`}
              />
              <ClipboardList
                className={`w-5 h-5 absolute left-3 top-3.5 ${
                  darkMode ? "text-gray-400" : "text-gray-400"
                }`}
              />
            </div>
            <button
              onClick={handleAddTodo}
              disabled={loading}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:block">Add</span>
            </button>
          </div>

          {/* Due Date and Priority */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <label
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Due Date
                </label>
              </div>
              <input
                type="date"
                value={dueDate}
                min={getTodayDate()}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-gray-300"
                }`}
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <div className="flex items-center gap-2 mb-1">
                <Flag className="w-4 h-4 text-gray-500" />
                <label
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Priority
                </label>
              </div>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-gray-300"
                }`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {overdueTodos.length > 0 && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
              darkMode
                ? "bg-red-900/30 border border-red-800"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className={darkMode ? "text-red-300" : "text-red-700"}>
              {overdueTodos.length} task(s) overdue!
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span
              className={`text-sm font-medium ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Filter tasks:
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all min-w-[100px] ${
                filter === "all"
                  ? "bg-blue-500 text-white shadow-md"
                  : darkMode
                  ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="text-sm font-medium">All</span>
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all min-w-[100px] ${
                filter === "active"
                  ? "bg-blue-500 text-white shadow-md"
                  : darkMode
                  ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Circle className="w-4 h-4" />
              <span className="text-sm font-medium">Active</span>
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all min-w-[100px] ${
                filter === "completed"
                  ? "bg-blue-500 text-white shadow-md"
                  : darkMode
                  ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Done</span>
            </button>
          </div>
        </div>

        {/* Todo List */}
        <div className="p-6">
          {loading && todos.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                Loading your tasks...
              </p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <ClipboardList
                  className={`w-8 h-8 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                />
              </div>
              <p
                className={`text-lg font-medium ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No tasks found
              </p>
              <p
                className={`text-sm mt-1 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {searchQuery
                  ? "No tasks match your search"
                  : filter === "all"
                  ? "Add your first task to get started!"
                  : filter === "active"
                  ? "No active tasks - great job!"
                  : "No completed tasks yet"}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredTodos.map((todo, index) => {
                const priorityInfo = getPriorityConfig(todo.priority);

                return (
                  <li
                    key={todo.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`rounded-xl p-4 transition-all cursor-move ${
                      darkMode
                        ? "bg-gray-700 border border-gray-600 hover:border-gray-500"
                        : "bg-white border border-gray-200 hover:shadow-md"
                    } ${dragIndex === index ? "opacity-50" : ""}`}
                  >
                    {editingTodoId === todo.id ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleEditSave(todo.id!)
                          }
                          className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            darkMode
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "border-gray-300"
                          }`}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditSave(todo.id!)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditingTodoId(null)}
                            className="p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleTodo(todo.id!)}
                            disabled={loading}
                            className={`p-1 rounded-full transition-colors ${
                              todo.completed
                                ? "text-green-500 hover:text-green-600"
                                : "text-gray-400 hover:text-gray-600"
                            } ${
                              loading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            {todo.completed ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              <Circle className="w-6 h-6" />
                            )}
                          </button>

                          <div className="flex-1">
                            <span
                              className={`cursor-pointer ${
                                loading ? "opacity-50" : ""
                              } ${
                                todo.completed
                                  ? "line-through text-gray-400"
                                  : darkMode
                                  ? "text-gray-200"
                                  : "text-gray-700"
                              }`}
                              onClick={() => !loading && toggleTodo(todo.id!)}
                            >
                              {todo.text}
                            </span>

                            {/* Due Date and Priority Badges */}
                            <div className="flex items-center gap-2 mt-1">
                              {todo.dueDate && (
                                <div
                                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                    isOverdue(todo.dueDate) && !todo.completed
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                      : darkMode
                                      ? "bg-gray-600 text-gray-300"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  {formatDate(todo.dueDate)}
                                  {isOverdue(todo.dueDate) &&
                                    !todo.completed && (
                                      <AlertCircle className="w-3 h-3 ml-1" />
                                    )}
                                </div>
                              )}

                              <div
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                  darkMode
                                    ? priorityInfo.bgColor.replace(
                                        "bg-",
                                        "bg-gray-"
                                      )
                                    : priorityInfo.bgColor
                                } ${priorityInfo.color}`}
                              >
                                <Flag className="w-3 h-3" />
                                {priorityInfo.label}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingTodoId(todo.id!);
                              setEditingText(todo.text);
                            }}
                            disabled={loading}
                            className={`p-2 rounded-lg transition-colors ${
                              loading
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeTodo(todo.id!)}
                            disabled={loading}
                            className={`p-2 rounded-lg transition-colors ${
                              loading
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Stats and Actions */}
        <div
          className={`px-6 py-4 border-t ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex flex-wrap justify-between items-center gap-4">
            {/* Statistics */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                  Total: <strong>{stats.total}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Circle className="w-4 h-4 text-blue-500" />
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                  Active: <strong>{stats.active}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                  Done: <strong>{stats.completed}</strong>
                </span>
              </div>
              {stats.overdue > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">
                    Overdue: <strong>{stats.overdue}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Clear Completed Button */}
            {stats.completed > 0 && (
              <button
                onClick={clearCompleted}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  loading
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                }`}
              >
                <Trash className="w-4 h-4" />
                <span className="text-sm font-medium">Clear Completed</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
