import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function Contagem() {
  const startDate = new Date(2023, 8, 23); // Namoro: 23/09/2023
  const [time, setTime] = useState({ anos: 0, meses: 0, dias: 0, horas: '00:00:00' });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      let diff = now - startDate;
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      setTime({
        anos: Math.floor(totalDays / 365),
        meses: Math.floor((totalDays % 365) / 30),
        dias: (totalDays % 365) % 30,
        horas: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto text-center relative z-10 pt-10">
      <h2 className="font-serif text-4xl font-bold mb-4 text-slate-800">O Nosso Tempo</h2>
      <p className="text-rose-400 italic mb-10 font-medium">Desde 23 de Setembro de 2023</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {[{ l: 'Anos', v: time.anos }, { l: 'Meses', v: time.meses }, { l: 'Dias', v: time.dias }, { l: 'Tempo', v: time.horas, c: 'text-rose-500' }].map((item, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg p-8 rounded-[2.5rem]">
            <span className={`block text-4xl font-bold mb-2 ${item.c || 'text-slate-800'}`}>{item.v}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{item.l}</span>
          </div>
        ))}
      </div>
      <Link to="/central" className="inline-flex items-center gap-2 text-slate-400 hover:text-rose-500 font-bold uppercase tracking-widest text-xs bg-white/50 px-6 py-3 rounded-full shadow-sm">
        <ArrowLeft size={16} /> Voltar ao Menu
      </Link>
    </div>
  );
}