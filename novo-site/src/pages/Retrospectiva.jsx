import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function Retrospectiva() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({
    hoursTogether: 0,
    daysTogether: 0,
    daysDating: 0,
    kisses: 0,
    hoursThisYear: 0
  });

  // CÁLCULO DE DATAS
  useEffect(() => {
    const togetherSince = new Date(2023, 6, 6);   
    const datingSince = new Date(2023, 8, 23);    
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const diffInfo = (start) => {
      const diffMs = now.getTime() - start.getTime();
      return {
        hours: Math.floor(diffMs / (1000 * 60 * 60)),
        days: Math.floor(diffMs / (1000 * 60 * 60 * 24))
      };
    };

    const together = diffInfo(togetherSince);
    const dating = diffInfo(datingSince);
    const yearOnly = diffInfo(yearStart);

    setStats({
      hoursTogether: together.hours.toLocaleString('pt-BR'),
      daysTogether: together.days.toLocaleString('pt-BR'),
      daysDating: dating.days.toLocaleString('pt-BR'),
      kisses: (together.days * 10).toLocaleString('pt-BR'),
      hoursThisYear: yearOnly.hours.toLocaleString('pt-BR')
    });
  }, []);

  // MOTOR DO CARROSSEL
  const TEMPO_POR_SLIDE = 6000;
  const TOTAL_SLIDES = 5;

  useEffect(() => {
    if (isPaused) return;
    const timer = setTimeout(() => {
      if (currentSlide < TOTAL_SLIDES - 1) {
        setCurrentSlide(prev => prev + 1);
      }
    }, TEMPO_POR_SLIDE);
    return () => clearTimeout(timer);
  }, [currentSlide, isPaused]);

  const handleTouch = (e) => {
    const clickX = e.clientX || (e.touches && e.touches[0].clientX);
    const screenWidth = window.innerWidth;
    if (clickX > screenWidth / 2) {
      if (currentSlide < TOTAL_SLIDES - 1) setCurrentSlide(prev => prev + 1);
    } else {
      if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F1EFE7] font-sans overflow-hidden">
      
      {/* CSS CUSTOMIZADO PARA OS PADRÕES DO SPOTIFY */}
      <style>{`
        .bg-concentric {
          background: repeating-radial-gradient(circle at 50% 50%, #000 0, #000 40px, #F1EFE7 40px, #F1EFE7 80px);
        }
        .text-outline {
          -webkit-text-stroke: 2px white;
          color: black;
        }
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float { animation: float-slow 8s ease-in-out infinite; }
        .spotify-font { font-family: 'Arial Black', Impact, sans-serif; letter-spacing: -0.05em; }
      `}</style>

      {/* BARRAS DE PROGRESSO TOPO */}
      <div className="absolute top-0 w-full pt-4 px-2 flex gap-1 z-[100]">
        {Array.from({ length: TOTAL_SLIDES }).map((_, index) => (
          <div key={index} className="h-1.5 flex-1 bg-gray-400/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all ease-linear"
              style={{
                width: index < currentSlide ? '100%' : index === currentSlide ? '100%' : '0%',
                transitionDuration: index === currentSlide ? `${TEMPO_POR_SLIDE}ms` : '0ms'
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* BOTÃO FECHAR */}
      <div className="absolute top-8 right-6 z-[100]">
        <Link to="/central" className="p-2 text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-all flex">
          <X size={24} />
        </Link>
      </div>

      {/* ÁREA CLICÁVEL */}
      <div 
        className="absolute inset-0 z-40"
        onClick={handleTouch}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        
        {/* ================= SLIDE 0: INTRO ================= */}
        {currentSlide === 0 && (
          <div className="w-full h-full bg-concentric flex flex-col items-center justify-center relative overflow-hidden animate-in fade-in duration-500">
            {/* Texto gigante de fundo laranja */}
            <div className="absolute top-1/4 -left-10 text-[250px] md:text-[350px] leading-none text-[#FF5500] font-black opacity-90 animate-float z-10 spotify-font">
              2025
            </div>
            
            {/* Texto principal com borda branca */}
            <div className="relative z-20 px-6 text-center">
              <h1 className="text-6xl md:text-8xl font-black text-outline uppercase leading-[0.85] tracking-tighter">
                Sua<br/>retrospectiva<br/>2025 está aqui!
              </h1>
              <div className="bg-black text-[#F1EFE7] inline-block px-4 py-2 mt-6 text-xl md:text-2xl font-bold uppercase">
                Vocês viveram. Nós contamos.
              </div>
            </div>
          </div>
        )}

        {/* ================= SLIDE 1: TEMPO JUNTOS ================= */}
        {currentSlide === 1 && (
          <div className="w-full h-full bg-[#F1EFE7] flex flex-col items-center justify-center relative overflow-hidden animate-in fade-in duration-500">
            {/* Desenhos abstratos estilo arame */}
            <svg className="absolute top-10 left-0 w-full h-64 opacity-80" viewBox="0 0 200 200" preserveAspectRatio="none">
              <path d="M-20,50 Q80,-20 120,80 T220,40" fill="none" stroke="black" strokeWidth="1.5" />
              <ellipse cx="100" cy="120" rx="140" ry="60" fill="none" stroke="black" strokeWidth="1.5" transform="rotate(-10 100 120)" />
            </svg>

            {/* Pedaço do círculo hipnótico no canto */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-concentric rounded-full opacity-90 border-8 border-[#90A8FF]"></div>

            <div className="relative z-20 px-8 w-full max-w-lg">
              <h1 className="text-5xl md:text-7xl font-black text-black leading-tight tracking-tighter uppercase mb-4">
                Vocês estão<br/>juntos há<br/>
                <span className="text-[#90A8FF] bg-black px-3 py-1 inline-block mt-2">
                  {stats.daysTogether} DIAS.
                </span>
              </h1>
              <p className="text-2xl font-bold text-black border-t-4 border-black pt-4 w-max">
                E o Pablo sem você é apenas 1%
              </p>
            </div>
          </div>
        )}

        {/* ================= SLIDE 2: TOP 5 ================= */}
        {currentSlide === 2 && (
          <div className="w-full h-full bg-[#F1EFE7] flex flex-col items-center justify-center relative overflow-hidden animate-in fade-in duration-500">
            {/* Bolinhas laranjas animadas no fundo */}
            <div className="absolute inset-0 flex flex-wrap justify-around items-center opacity-90 z-0">
              {Array.from({length: 12}).map((_, i) => (
                <div key={i} className="w-16 h-16 md:w-24 md:h-24 bg-[#FF5500] rounded-full shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-float" style={{ animationDelay: `${i * 0.3}s` }}></div>
              ))}
            </div>

            <svg className="absolute top-1/2 left-0 w-full h-32 opacity-80 z-10" viewBox="0 0 200 100" preserveAspectRatio="none">
              <path d="M-20,50 Q100,0 220,50" fill="none" stroke="black" strokeWidth="2" />
              <path d="M-20,70 Q100,120 220,70" fill="none" stroke="black" strokeWidth="2" />
            </svg>

            <div className="relative z-20 w-full max-w-md px-6">
              <h2 className="text-2xl md:text-3xl font-black text-black uppercase mb-8">
                Seu Top [MOMENTOS]
              </h2>
              
              <div className="flex flex-col gap-3 md:gap-4 text-3xl md:text-5xl font-black uppercase tracking-tighter">
                {['Beijinhos', 'Conchinha', 'Viajar', 'Filme agarradinho', 'Jogar!!!!!'].map((item, i) => (
                  <div key={i} className="flex gap-3 items-center group">
                    <span className="text-black">{i + 1}</span>
                    <span className="bg-black text-[#F1EFE7] px-3 py-1 leading-[0.9] transform transition-transform group-hover:scale-105">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= SLIDE 3: O GRANDE NÚMERO ================= */}
        {currentSlide === 3 && (
          <div className="w-full h-full bg-black flex flex-col items-start justify-center relative overflow-hidden animate-in fade-in duration-500 px-8 md:px-20">
            {/* SVG Arame branco */}
            <svg className="absolute top-20 right-0 w-full h-64 opacity-50" viewBox="0 0 200 200" preserveAspectRatio="none">
              <ellipse cx="150" cy="100" rx="120" ry="50" fill="none" stroke="white" strokeWidth="1" transform="rotate(15 150 100)" />
              <path d="M100,0 Q150,100 250,50" fill="none" stroke="white" strokeWidth="1" />
            </svg>

            {/* Pedaço de círculo no canto esquerdo inferior */}
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-concentric rounded-tr-full opacity-80 border-r-8 border-t-8 border-[#90A8FF]"></div>

            <div className="relative z-20">
              <h1 className="text-[80px] md:text-[140px] font-black text-[#FF5500] leading-none tracking-tighter spotify-font drop-shadow-[4px_4px_0_rgba(255,255,255,1)]">
                {stats.hoursTogether}
              </h1>
              <p className="text-xl md:text-3xl text-gray-300 font-medium mt-2">
                Horas totais de amorzinho intenso.
              </p>
            </div>
          </div>
        )}

        {/* ================= SLIDE 4: RESUMO FINAL ================= */}
        {currentSlide === 4 && (
          <div className="w-full h-full bg-[#F1EFE7] flex flex-col items-center justify-center relative overflow-hidden animate-in fade-in duration-500 p-6">
            
            <div className="w-full max-w-sm border-4 border-black bg-[#F1EFE7] shadow-[10px_10px_0_0_rgba(0,0,0,1)] p-6 relative">
              {/* O famoso adesivo laranja de 2025 */}
              <div className="absolute -left-8 top-10 text-6xl font-black text-[#FF5500] transform -rotate-90 text-outline uppercase">
                2025
              </div>

              {/* Foto Central - Troque a URL se quiser! */}
              <div className="w-full aspect-square bg-[#90A8FF] border-4 border-black mb-6 overflow-hidden relative group">
                 {/* Substitua o src abaixo pela foto de vocês! */}
                 <img src="/images/wedding.jpg" alt="Vocês" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                 <div className="absolute inset-0 bg-black/10"></div>
              </div>

              <div className="flex justify-between w-full border-b-2 border-black pb-2 mb-4">
                <div className="w-1/2">
                  <h3 className="text-xs uppercase font-bold text-gray-500 mb-1">Top Artista</h3>
                  <ol className="text-sm font-black uppercase leading-tight space-y-1">
                    <li>1 Ana Clara</li>
                    <li>2 Pablo</li>
                  </ol>
                </div>
                <div className="w-1/2">
                  <h3 className="text-xs uppercase font-bold text-gray-500 mb-1">Top Gênero</h3>
                  <ul className="text-sm font-black uppercase leading-tight space-y-1">
                    <li>1 Romance</li>
                    <li>2 Comédia</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between w-full items-end">
                <div>
                  <h3 className="text-xs uppercase font-bold text-gray-500">Minutos ouvidos</h3>
                  <p className="text-2xl font-black uppercase">{stats.hoursThisYear}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xs uppercase font-bold text-gray-500">Obrigado.</h3>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}