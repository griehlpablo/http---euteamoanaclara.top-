import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Maximize2, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

export default function Galeria() {
  const [fotos, setFotos] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // O "Cão Farejador" de URLs (Função recursiva)
  const findImageLink = (data) => {
    // Se já for a string direta
    if (typeof data === 'string') {
      if (data.startsWith('http') || data.startsWith('data:image')) return data;
      return null;
    }
    
    // Se for um objeto, vasculha as chaves
    if (data && typeof data === 'object') {
      if (typeof data.url === 'string') return data.url;
      if (typeof data.image === 'string') return data.image;
      if (typeof data.imageUrl === 'string') return data.imageUrl;
      if (typeof data.link === 'string') return data.link;

      // Cava mais fundo nas subpastas do objeto
      for (let key in data) {
        const found = findImageLink(data[key]);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    const galleryRef = ref(rtdb, 'gallery/pablo-ana');
    onValue(galleryRef, (snapshot) => {
      const data = snapshot.val();
      
      console.log("1. DEBUG GRIEHL - Direto do Banco:", data);

      if (data) {
        const listaBruta = Object.values(data);
        
        // Passa o farejador e limpa quem não tem link válido
        const listaTratada = listaBruta
          .map(item => findImageLink(item))
          .filter(url => typeof url === 'string' && url.length > 10); 
        
        console.log("2. DEBUG GRIEHL - URLs Sobreviventes:", listaTratada);
        setFotos(listaTratada.reverse());
      }
      setLoading(false);
    });
  }, []);

  const openModal = (index) => {
    if (!fotos[index]) return;
    setCurrentIndex(index);
    setSelectedImg(fotos[index]);
  };

  const nextImg = () => {
    const next = (currentIndex + 1) % fotos.length;
    setCurrentIndex(next);
    setSelectedImg(fotos[next]);
  };

  const prevImg = () => {
    const prev = (currentIndex - 1 + fotos.length) % fotos.length;
    setCurrentIndex(prev);
    setSelectedImg(fotos[prev]);
  };

  return (
    <div className="min-h-screen bg-rose-50 p-4 pb-20">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8 pt-4">
        <Link to="/central" className="p-2 bg-white rounded-full shadow-md text-rose-500 hover:scale-110 transition-transform">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-serif font-bold text-rose-600 flex items-center gap-2">
          Nossa Galeria <Heart className="fill-rose-600" />
        </h1>
        <div className="w-10"></div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-rose-300">
          <Loader2 className="animate-spin mb-2" size={40} />
          <p>Carregando memórias...</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotos.map((url, index) => (
            <div 
              key={index}
              onClick={() => openModal(index)}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-white shadow-lg cursor-pointer border-4 border-white transition-all hover:border-rose-200 z-10"
            >
              <img 
                src={url} 
                alt={`Momento ${index}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
              />
              <div className="absolute inset-0 bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <Maximize2 className="text-white" size={32} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedImg && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          
          {/* BOTÃO FECHAR */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImg(null);
            }}
            className="absolute top-10 right-10 z-[10000] bg-rose-600 text-white p-4 rounded-full shadow-2xl hover:bg-rose-700 transition-all border-2 border-white/20"
          >
            <X size={40} strokeWidth={3} />
          </button>

          {/* Navegação Esquerda */}
          <button onClick={prevImg} className="absolute left-6 z-[10000] p-3 text-white/70 hover:text-white bg-white/10 rounded-full backdrop-blur-md">
            <ChevronLeft size={48} />
          </button>

          <img 
            src={selectedImg} 
            className="max-w-full max-h-[90vh] object-contain shadow-2xl select-none"
            alt="Foto expandida"
          />

          {/* Navegação Direita */}
          <button onClick={nextImg} className="absolute right-6 z-[10000] p-3 text-white/70 hover:text-white bg-white/10 rounded-full backdrop-blur-md">
            <ChevronRight size={48} />
          </button>

          {/* Contador */}
          <div className="absolute bottom-10 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-white font-bold">
            {currentIndex + 1} / {fotos.length}
          </div>
        </div>
      )}
    </div>
  );
}