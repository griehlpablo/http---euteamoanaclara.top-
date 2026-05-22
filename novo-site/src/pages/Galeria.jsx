import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Maximize2, X, ChevronLeft, ChevronRight, Loader2, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

const albums = ['Todos', 'Memórias', 'Nós dois', 'Datas especiais', 'Prints', 'Família', 'Viagens'];

const findImageLink = (data) => {
  if (typeof data === 'string') {
    if (data.startsWith('http') || data.startsWith('data:image')) return data;
    return null;
  }
  if (data && typeof data === 'object') {
    if (typeof data.url === 'string') return data.url;
    if (typeof data.image === 'string') return data.image;
    if (typeof data.imageUrl === 'string') return data.imageUrl;
    if (typeof data.link === 'string') return data.link;
    for (let key in data) {
      const found = findImageLink(data[key]);
      if (found) return found;
    }
  }
  return null;
};

const findAlbum = (data) => {
  if (data && typeof data === 'object') {
    return data.album || data.category || data.categoria || 'Memórias';
  }
  return 'Memórias';
};

export default function Galeria() {
  const [fotos, setFotos] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeAlbum, setActiveAlbum] = useState('Todos');
  
  // A MÁGICA AQUI: O estado inicial agora é 'carousel' ao invés de 'grid'
  const [viewMode, setViewMode] = useState('carousel');

  useEffect(() => {
    const galleryRef = ref(rtdb, 'gallery/pablo-ana');
    const unsubscribe = onValue(galleryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const listaBruta = Object.values(data);
        const listaTratada = listaBruta
          .map(item => ({
            url: findImageLink(item),
            album: findAlbum(item),
          }))
          .filter(item => typeof item.url === 'string' && item.url.length > 10); 
        
        setFotos(listaTratada.reverse());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredFotos = activeAlbum === 'Todos'
    ? fotos
    : fotos.filter((foto) => foto.album === activeAlbum);

  const handleAlbumChange = (album) => {
    setActiveAlbum(album);
    setCurrentIndex(0);
    setSelectedImg(null);
  };

  const openFullscreen = (index) => {
    if (!filteredFotos[index]) return;
    setCurrentIndex(index);
    setSelectedImg(filteredFotos[index].url);
  };

  const nextImg = () => {
    if (filteredFotos.length === 0) return;
    setCurrentIndex((prev) => {
      const next = (prev + 1) % filteredFotos.length;
      if (selectedImg) setSelectedImg(filteredFotos[next].url);
      return next;
    });
  };

  const prevImg = () => {
    if (filteredFotos.length === 0) return;
    setCurrentIndex((prev) => {
      const next = (prev - 1 + filteredFotos.length) % filteredFotos.length;
      if (selectedImg) setSelectedImg(filteredFotos[next].url);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-rose-50 p-4 pb-20">
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8 pt-4">
        <Link to="/central" className="p-2 bg-white rounded-full shadow-md text-rose-500 hover:scale-110 transition-transform">
          <ArrowLeft size={24} />
        </Link>
        
        <h1 className="text-3xl font-serif font-bold text-rose-600 flex items-center gap-2">
          Nossa Galeria <Heart className="fill-rose-600" />
        </h1>

        <div className="flex bg-white rounded-full shadow-sm p-1 border border-rose-100">
          <button
            onClick={() => setViewMode('grid')}
            title="Modo Grade"
            className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-rose-100 text-rose-600 shadow-inner' : 'text-rose-300 hover:text-rose-500'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => {
              setViewMode('carousel');
              setCurrentIndex(0);
            }}
            title="Modo Carrossel"
            className={`p-2 rounded-full transition-all ${viewMode === 'carousel' ? 'bg-rose-100 text-rose-600 shadow-inner' : 'text-rose-300 hover:text-rose-500'}`}
          >
            <ImageIcon size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mb-8 flex gap-2 overflow-x-auto py-2 custom-scrollbar">
        {albums.map((album) => (
          <button
            key={album}
            onClick={() => handleAlbumChange(album)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold border transition-all ${
              activeAlbum === album
                ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                : 'bg-white/70 text-rose-400 border-rose-100 hover:bg-rose-50'
            }`}
          >
            {album}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-rose-300">
          <Loader2 className="animate-spin mb-2" size={40} />
          <p>Carregando memórias...</p>
        </div>
      ) : (
        <>
          {filteredFotos.length === 0 && (
            <div className="max-w-xl mx-auto bg-white/70 backdrop-blur-lg border border-white/60 rounded-[2rem] p-10 text-center shadow-xl">
              <Heart className="w-14 h-14 text-rose-300 fill-current mx-auto mb-4" />
              <h2 className="font-serif text-2xl font-bold text-rose-600 mb-2">Nada nesse álbum ainda</h2>
              <p className="text-sm text-slate-400">Quando uma foto entrar em “{activeAlbum}”, ela aparece aqui com todo carinho.</p>
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
              {filteredFotos.map((foto, index) => (
                <div 
                  key={index}
                  onClick={() => openFullscreen(index)}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-white shadow-lg cursor-pointer border-4 border-white transition-all hover:border-rose-200 z-10"
                >
                  <img 
                    src={foto.url} 
                    alt={`Momento ${index}`} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Maximize2 className="text-white" size={32} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'carousel' && filteredFotos.length > 0 && (
            <div className="max-w-4xl mx-auto flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="relative w-full aspect-[4/5] sm:aspect-video bg-white/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl mb-6 border-4 border-white flex items-center justify-center group">
                <img 
                  src={filteredFotos[currentIndex]?.url} 
                  loading="lazy"
                  decoding="async"
                  className="max-w-full max-h-full object-contain drop-shadow-lg transition-all duration-300"
                  alt={`Destaque ${currentIndex}`}
                />
                
                <button onClick={prevImg} className="absolute left-4 p-3 bg-white/70 hover:bg-white text-rose-500 shadow-lg backdrop-blur-md rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-110">
                  <ChevronLeft size={32} />
                </button>
                <button onClick={nextImg} className="absolute right-4 p-3 bg-white/70 hover:bg-white text-rose-500 shadow-lg backdrop-blur-md rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-110">
                  <ChevronRight size={32} />
                </button>
                
                <button 
                  onClick={() => openFullscreen(currentIndex)}
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-xl backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                >
                  <Maximize2 size={24} />
                </button>
              </div>

              <div className="w-full flex gap-3 overflow-x-auto py-2 px-1 snap-x scroll-smooth custom-scrollbar">
                {filteredFotos.map((foto, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden snap-center transition-all duration-300 ${
                      currentIndex === idx 
                        ? 'ring-4 ring-rose-400 scale-105 shadow-lg z-10' 
                        : 'opacity-50 hover:opacity-100 hover:scale-95 grayscale-[30%]'
                    }`}
                  >
                    <img src={foto.url} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selectedImg && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImg(null);
            }}
            className="absolute top-10 right-10 z-[10000] bg-rose-600 text-white p-4 rounded-full shadow-2xl hover:bg-rose-700 transition-all border-2 border-white/20 hover:rotate-90 duration-300"
          >
            <X size={32} strokeWidth={3} />
          </button>

          <button onClick={prevImg} className="absolute left-6 z-[10000] p-3 text-white/70 hover:text-white bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition-all">
            <ChevronLeft size={48} />
          </button>

          <img 
            src={selectedImg} 
            decoding="async"
            className="max-w-full max-h-[90vh] object-contain shadow-2xl select-none animate-in zoom-in-95 duration-300"
            alt="Foto expandida"
          />

          <button onClick={nextImg} className="absolute right-6 z-[10000] p-3 text-white/70 hover:text-white bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition-all">
            <ChevronRight size={48} />
          </button>

          <div className="absolute bottom-10 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-white font-medium border border-white/10">
            {currentIndex + 1} de {filteredFotos.length}
          </div>
        </div>
      )}
    </div>
  );
}
