import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ListChecks, Plus, Trash2 } from "lucide-react";
import { supabase } from "../supabase";

const GLASS_CLASSES =
  "bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-white/50 dark:border-slate-600 shadow-lg";

const isVisibleItem = (item) =>
  !String(item?.text || "").startsWith("__");

export default function BucketList() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      const { data, error } = await supabase
        .from("bucketlist")
        .select("*")
        .order("createdAt", { ascending: true });

      if (error) {
        console.error("Supabase error fetching bucketlist:", error);
      } else if (mounted) {
        setItems((data || []).filter(isVisibleItem));
      }
      if (mounted) setLoading(false);
    };

    loadItems();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddItem = async (event) => {
    event.preventDefault();
    const text = newItem.trim();
    if (!text) return;

    try {
      const { data, error } = await supabase
        .from("bucketlist")
        .insert([
          {
            text,
            completed: false,
            createdAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (error) throw error;
      if (data && isVisibleItem(data)) {
        setItems((previous) => [...previous, data]);
      }
      setNewItem("");
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
    }
  };

  const handleToggleComplete = async (itemId, completed) => {
    try {
      const { error } = await supabase
        .from("bucketlist")
        .update({ completed: !completed })
        .eq("id", itemId);
      if (error) throw error;
      setItems((previous) =>
        previous.map((item) =>
          item.id === itemId ? { ...item, completed: !completed } : item,
        ),
      );
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from("bucketlist")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
      setItems((previous) => previous.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Erro ao deletar item:", error);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-rose-500" />
          <p className="text-slate-500 dark:text-slate-400">Carregando lista...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl py-8"
    >
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-serif text-4xl font-bold text-slate-800 dark:text-slate-200">
          📝 Bucket List
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Nossos sonhos e metas para realizar juntos ✨
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleAddItem}
        className={`${GLASS_CLASSES} mb-8 rounded-3xl p-6`}
      >
        <div className="flex gap-4">
          <input
            type="text"
            value={newItem}
            onChange={(event) => setNewItem(event.target.value)}
            placeholder="Adicione um novo sonho ou meta..."
            className="flex-1 rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-3 font-bold text-white shadow-md"
          >
            <Plus className="h-5 w-5" />
            Adicionar
          </motion.button>
        </div>
      </motion.form>

      <AnimatePresence mode="popLayout">
        {items.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`${GLASS_CLASSES} rounded-3xl p-12 text-center`}
          >
            <ListChecks className="mx-auto mb-4 h-16 w-16 text-slate-400" />
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Sua lista está vazia. Comece adicionando seus primeiros sonhos! 💭
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`${GLASS_CLASSES} flex items-center gap-4 rounded-3xl p-6 ${
                  item.completed ? "opacity-75" : ""
                }`}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() =>
                    handleToggleComplete(item.id, item.completed)
                  }
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    item.completed
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-slate-300 hover:border-rose-500 dark:border-slate-600"
                  }`}
                >
                  {item.completed && <Check className="h-4 w-4" />}
                </motion.button>

                <span
                  className={`flex-1 text-lg ${
                    item.completed
                      ? "text-slate-500 line-through dark:text-slate-400"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {item.text}
                </span>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900"
                >
                  <Trash2 className="h-5 w-5" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
