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

  useEffect(() => {
    const galleryRef = ref(rtdb, 'gallery/pablo-ana'); // Caminho corrigido com 2 'L's
    onValue(galleryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Garantindo que pegamos a URL, seja o dado uma string ou um objeto
        const listaBruta = Object.values(data);
        const listaTratada = listaBruta.map(item => typeof item === 'object' ? item.url : item);
        
        setFotos(listaTratada.reverse());
      }
      setLoading(false);
    });
  }, []);

  const openModal = (index) => {
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
              className="group relative aspect-square overflow-hidden rounded-2xl bg-white shadow-lg cursor-pointer border-4 border-white transition-all hover:border-rose-200"
            >
              <img 
                src={url} 
                alt={`Momento ${index}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => { e.target.src = "https://via.placeholder.com/400?text=Erro+ao+Carregar"; }}
              />
              <div className="absolute inset-0 bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="text-white" size={32} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Carrossel Aprimorado */}
      {selectedImg && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          
          {/* BOTÃO FECHAR (X) - Agora com fundo para ser visível */}
          <button 
            onClick={() => setSelectedImg(null)}
            className="absolute top-6 right-6 z-[1000] bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all border border-white/20"
            title="Fechar"
          >
            <X size={32} />
          </button>

          {/* Navegação Esquerda */}
          <button onClick={prevImg} className="absolute left-4 z-[1000] p-2 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full">
            <ChevronLeft size={40} />
          </button>

          {/* Imagem em Tela Cheia */}
          <div className="max-w-5xl w-full h-full flex items-center justify-center select-none">
            <img 
              src={selectedImg} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in duration-300"
              alt="Visualização"
            />
          </div>

          {/* Navegação Direita */}
          <button onClick={nextImg} className="absolute right-4 z-[1000] p-2 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full">
            <ChevronRight size={40} />
          </button>

          {/* Contador */}
          <div className="absolute bottom-10 bg-black/40 px-4 py-1 rounded-full text-white/80 text-sm font-medium">
            {currentIndex + 1} / {fotos.length}
          </div>
        </div>
      )}
    </div>
  );
}