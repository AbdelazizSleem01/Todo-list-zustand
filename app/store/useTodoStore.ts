import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Priority = "low" | "medium" | "high";

export interface Todo {
  _id?: string;
  id?: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  lastSync: number;
  addTodo: (text: string, dueDate?: string, priority?: Priority) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  removeTodo: (id: string) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Omit<Todo, "id" | "createdAt">>) => Promise<void>;
  clearCompleted: () => Promise<void>;
  fetchTodos: () => Promise<void>;
  syncTodos: () => Promise<void>;
  searchTodos: (query: string) => Todo[];
  reorderTodos: (startIndex: number, endIndex: number) => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],
      loading: false,
      error: null,
      lastSync: 0,

      fetchTodos: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/todos');
          if (!response.ok) throw new Error('Failed to fetch todos');
          const todos = await response.json();
          
          const formattedTodos = todos.map((todo: Todo) => ({
            ...todo,
            id: todo._id || todo.id
          }));
          
          set({ 
            todos: formattedTodos, 
            loading: false,
            lastSync: Date.now()
          });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      syncTodos: async () => {
        const { lastSync, todos } = get();
        
        try {
          const response = await fetch('/api/todos/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lastSync,
              todos
            }),
          });

          if (!response.ok) throw new Error('Sync failed');
          
          const { todos: serverTodos } = await response.json();
          
          set({ 
            todos: serverTodos.map((todo: Todo) => ({
              ...todo,
              id: todo._id || todo.id
            })),
            lastSync: Date.now()
          });
        } catch (error) {
          console.error('Sync error:', error);
        }
      },

      // ... بقية الدوال تبقى كما هي
      addTodo: async (text, dueDate, priority = "medium") => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/todos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, dueDate, priority }),
          });

          if (!response.ok) throw new Error('Failed to add todo');
          
          const newTodo = await response.json();
          const formattedTodo = {
            ...newTodo,
            id: newTodo._id || newTodo.id
          };

          set((state) => ({
            todos: [...state.todos, formattedTodo],
            loading: false
          }));
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      toggleTodo: async (id) => {
        set({ loading: true, error: null });
        try {
          const { todos } = get();
          const todo = todos.find(t => t.id === id);
          if (!todo) throw new Error('Todo not found');

          const response = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed: !todo.completed }),
          });

          if (!response.ok) throw new Error('Failed to toggle todo');

          set((state) => ({
            todos: state.todos.map((todo) =>
              todo.id === id ? { ...todo, completed: !todo.completed } : todo
            ),
            loading: false
          }));
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      removeTodo: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/todos/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) throw new Error('Failed to delete todo');

          set((state) => ({
            todos: state.todos.filter((todo) => todo.id !== id),
            loading: false
          }));
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      updateTodo: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) throw new Error('Failed to update todo');

          set((state) => ({
            todos: state.todos.map((todo) =>
              todo.id === id ? { ...todo, ...updates } : todo
            ),
            loading: false
          }));
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      clearCompleted: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/todos/clear-completed', {
            method: 'POST',
          });

          if (!response.ok) throw new Error('Failed to clear completed todos');

          set((state) => ({
            todos: state.todos.filter((todo) => !todo.completed),
            loading: false
          }));
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      searchTodos: (query) => {
        const { todos } = get();
        return todos.filter(todo => 
          todo.text.toLowerCase().includes(query.toLowerCase())
        );
      },

      reorderTodos: (startIndex, endIndex) => {
        set((state) => {
          const result = Array.from(state.todos);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { todos: result };
        });
      },
    }),
    {
      name: "todo-storage",
      partialize: (state) => ({ 
        todos: state.todos,
        lastSync: state.lastSync 
      }),
    }
  )
);