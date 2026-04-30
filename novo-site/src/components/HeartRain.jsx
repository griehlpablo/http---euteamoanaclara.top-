import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HeartRain = () => {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    // Cria um novo coração a cada 800ms para não pesar o processamento
    const interval = setInterval(() => {
      setHearts(prev => [
        ...prev,
        {
          id: Date.now(),
          left: Math.random() * 100, // Posição horizontal aleatória
          size: Math.random() * 15 + 10, // Tamanho entre 10px e 25px
          duration: Math.random() * 3 + 5, // Queda lenta (5 a 8 segundos)
        }
      ]);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    // Z-index 0 para ficar atrás do conteúdo, mas pointer-events-none para não bloquear cliques
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <AnimatePresence>
        {hearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{ y: -50, opacity: 0, x: `${heart.left}vw` }}
            animate={{ 
              y: '110vh', 
              opacity: [0, 0.6, 0.6, 0],
              rotate: Math.random() * 360
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: heart.duration, ease: "linear" }}
            onAnimationComplete={() => {
              // Remove o coração do estado após a animação para limpar memória
              setHearts(prev => prev.filter(h => h.id !== heart.id));
            }}
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