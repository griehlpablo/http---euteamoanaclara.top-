import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase'; // Certifique-se de exportar o 'rtdb' no seu firebase.js

export default function Galeria() {
  const [fotos, setFotos] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Ajustado de 'galery' para 'gallery' com dois Ls
    const galleryRef = ref(rtdb, 'gallery/pablo-ana'); 
    
    onValue(galleryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const listaFotos = Object.values(data);
        setFotos(listaFotos.reverse());
      } else {
        console.log("Caminho não encontrado no RTDB: gallery/pablo-ana");
      }
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
        <div className="w-10"></div> {/* Espaçador */}
      </div>

      {/* Grid de Fotos */}
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
            />
            <div className="absolute inset-0 bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="text-white" size={32} />
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Carrossel (Tela Cheia) */}
      {selectedImg && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <button 
            onClick={() => setSelectedImg(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <X size={40} />
          </button>

          <button onClick={prevImg} className="absolute left-4 p-2 text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={48} />
          </button>

          <div className="max-w-4xl w-full h-[80vh] flex items-center justify-center">
            <img 
              src={selectedImg} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in duration-300"
              alt="Visualização"
            />
          </div>

          <button onClick={nextImg} className="absolute right-4 p-2 text-white/50 hover:text-white transition-colors">
            <ChevronRight size={48} />
          </button>

          <div className="absolute bottom-10 text-white/60 font-medium">
            {currentIndex + 1} / {fotos.length}
          </div>
        </div>
      )}
    </div>
  );
}