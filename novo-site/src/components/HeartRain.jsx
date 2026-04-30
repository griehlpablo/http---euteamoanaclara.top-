import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HeartRain = () => {
  const [hearts, setHearts] = useState([]);
  useEffect(() => {
    const interval = setInterval(() => {
      setHearts(prev => [...prev, { 
        id: Date.now(), 
        left: Math.random() * 100, 
        size: Math.random() * 15 + 10, 
        duration: Math.random() * 3 + 5 
      }]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <AnimatePresence>
        {hearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{ y: -50, opacity: 0, x: `${heart.left}vw` }}
            animate={{ y: '110vh', opacity: [0, 0.6, 0.6, 0], rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: heart.duration, ease: "linear" }}
            onAnimationComplete={() => setHearts(prev => prev.filter(h => h.id !== heart.id))}
            className="absolute text-rose-300/40"
            style={{ fontSize: heart.size }}
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
export default HeartRain;