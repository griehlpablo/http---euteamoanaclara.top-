import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, MapPin, Users, History, FileText, Globe, Footprints } from 'lucide-react';

export default function Genealogia() {
  const [activeTab, setActiveTab] = useState('arvore');

  const glassClasses = "bg-white/60 backdrop-blur-lg border border-white/50 shadow-sm rounded-3xl p-6";

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 relative z-50">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-8 pt-4">
        <Link to="/central" className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:scale-110 transition-transform cursor-pointer">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2 font-serif">
          Origens & Raízes <BookOpen className="text-rose-500" />
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HERO SECTION */}
        <div className="bg-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <h2 className="text-3xl font-serif font-bold mb-2 relative z-10">Família Kovalek & Felipe</h2>
          <p className="text-slate-300 relative z-10 max-w-2xl leading-relaxed">
            Uma jornada que atravessa fronteiras, desde as terras frias da Galícia, no antigo Império Austro-Húngaro, até as terras promissoras de Prudentópolis no Paraná. Esta é a história da ascendência de Ana Clara.
          </p>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('arvore')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm whitespace-nowrap flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'arvore' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={16} /> Árvore Direta
          </button>
          <button 
            onClick={() => setActiveTab('historia')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm whitespace-nowrap flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'historia' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History size={16} /> Linha do Tempo
          </button>
          <button 
            onClick={() => setActiveTab('curiosidades')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm whitespace-nowrap flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'curiosidades' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FileText size={16} /> Registros & Curiosidades
          </button>
        </div>

        {/* CONTEÚDO: ÁRVORE GENEALÓGICA */}
        {activeTab === 'arvore' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            
            <div className={`${glassClasses} border-l-4 border-l-rose-500`}>
              <div className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Geração Atual</div>
              <h3 className="text-xl font-black text-slate-800">Ana Clara Kovalek Santos</h3>
              <p className="text-sm text-slate-500 mt-1">Nascida em 2005.</p>
            </div>

            <div className="flex gap-4 px-4 opacity-50"><div className="w-0.5 h-6 bg-slate-300 mx-auto"></div></div>

            <div className={`${glassClasses} border-l-4 border-l-slate-400`}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pais (Geração 2)</div>
              <h3 className="text-lg font-bold text-slate-800">Maria Juliana Felipe (1980) & Saint-Clair Santos (1975)</h3>
            </div>

            <div className="flex gap-4 px-4 opacity-50"><div className="w-0.5 h-6 bg-slate-300 mx-auto"></div></div>

            <div className={`${glassClasses} border-l-4 border-l-slate-400`}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avós Maternos (Geração 3)</div>
              <h3 className="text-lg font-bold text-slate-800">Justina Kovalek (1942-2015) & Eleutério Felipe (1945)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className={`${glassClasses} bg-white/80`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ramo Kovalek (Bisavós)</div>
                <h3 className="font-bold text-slate-800">Paulo Kovalek (1900-1967)</h3>
                <p className="text-sm text-slate-500 mb-3">Casado com Anastacia Gelinski (1912-1981)</p>
                
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-4 border-t pt-3">Trisavós (Imigrantes)</div>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Grzegorz Kowalyk & Anna (1871-1927)</li>
                  <li>• André Zielinski (1869-1919) & Natália Materacka</li>
                </ul>
              </div>

              <div className={`${glassClasses} bg-white/80`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ramo Felipe (Bisavós)</div>
                <h3 className="font-bold text-slate-800">Theodoro Felipe (1906-1991)</h3>
                <p className="text-sm text-slate-500 mb-3">Casado com Maria Veresiuk (1906-1977)</p>
                
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-4 border-t pt-3">Trisavós (Imigrantes)</div>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Nicolaus Pylypiw & Anna</li>
                  <li>• Alexius Weresiuk & Maria</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO: LINHA DO TEMPO */}
        {activeTab === 'historia' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
            {/* Linha vertical decorativa */}
            <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-0.5 bg-slate-200 -z-10 hidden md:block"></div>

            <div className={`${glassClasses} flex flex-col md:flex-row gap-6 items-start`}>
              <div className="bg-slate-100 p-3 rounded-2xl text-slate-500 shrink-0"><Globe size={24} /></div>
              <div>
                <span className="text-rose-500 font-bold text-sm">~1869 a 1891</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1 mb-2">Raízes na Europa Oriental</h3>
                <p className="text-slate-600 leading-relaxed">
                  A história começa na Galícia Oriental, uma região que hoje fica entre a Polônia e a Ucrânia. O ramo Kowalyk tem origens mapeadas no vilarejo de Hulcze (paróquia de Dołhobyczów).
                </p>
              </div>
            </div>

            <div className={`${glassClasses} flex flex-col md:flex-row gap-6 items-start`}>
              <div className="bg-slate-100 p-3 rounded-2xl text-slate-500 shrink-0"><Footprints size={24} /></div>
              <div>
                <span className="text-rose-500 font-bold text-sm">1890 a 1905</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1 mb-2">A Grande Imigração</h3>
                <p className="text-slate-600 leading-relaxed">
                  As famílias deixam o Império Austro-Húngaro rumo ao Brasil, estabelecendo-se em Prudentópolis, Paraná. Em 1906, nascem os primeiros brasileiros da linhagem: Theodoro e Maria.
                </p>
              </div>
            </div>

            <div className={`${glassClasses} flex flex-col md:flex-row gap-6 items-start border-2 border-rose-100`}>
              <div className="bg-rose-100 p-3 rounded-2xl text-rose-500 shrink-0"><MapPin size={24} /></div>
              <div>
                <span className="text-rose-500 font-bold text-sm">24 de Janeiro de 1942</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1 mb-2">A Jornada de Paulo Kovalek</h3>
                <p className="text-slate-600 leading-relaxed">
                  Um marco histórico documentado em foto: Paulo Kovalek inicia uma longa viagem a cavalo, saindo de Roncador (PR) com destino a Curitiba, uma jornada que durou 15 dias.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO: CURIOSIDADES */}
        {activeTab === 'curiosidades' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="text-blue-500" size={20} /> Metamorfose dos Nomes
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Ao chegarem nos cartórios brasileiros, os nomes sofreram adaptações drásticas por conta da barreira do idioma:
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-500 line-through decoration-rose-300">Pylypiw</span>
                  <ArrowRight size={14} className="text-slate-300" />
                  <span className="font-bold text-slate-800">Felipe (Filipe)</span>
                </li>
                <li className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-500 line-through decoration-rose-300">Kowalyk / Kowalik</span>
                  <ArrowRight size={14} className="text-slate-300" />
                  <span className="font-bold text-slate-800">Kovalek</span>
                </li>
                <li className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-500 line-through decoration-rose-300">Zieliński</span>
                  <ArrowRight size={14} className="text-slate-300" />
                  <span className="font-bold text-slate-800">Gelinski</span>
                </li>
                <li className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-500 line-through decoration-rose-300">Weresiuk</span>
                  <ArrowRight size={14} className="text-slate-300" />
                  <span className="font-bold text-slate-800">Veresiuk</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <History className="text-rose-400" size={20} /> O Império Austro-Húngaro
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                A Galícia Oriental era uma região multiétnica e multilíngue. Os registros encontrados dividem-se entre línguas (polonês, latim, ucraniano) e confissões religiosas:
              </p>
              <div className="p-4 bg-white/10 rounded-xl">
                <p className="text-sm font-medium">
                  Enquanto a família Weresiuk pertencia à paróquia Católica Romana, a linhagem Kowalyk e Pylypiw tinha raízes na tradição Ortodoxa ou Greco-Católica.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}