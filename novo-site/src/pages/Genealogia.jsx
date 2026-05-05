import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, MapPin, History, FileText, Globe, Footprints, User, Download } from 'lucide-react';

// ==========================================
// COMPONENTE DO CARTÃO DA ÁRVORE
// ==========================================
const MembroCard = ({ nome, datas, foto, doc, papel }) => (
  <div className="flex flex-col items-center relative z-10 w-32 md:w-40 group">
    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border-4 border-rose-100 shadow-md overflow-hidden flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
      {foto ? (
        <img src={foto} alt={nome} className="w-full h-full object-cover" />
      ) : (
        <User size={32} className="text-slate-300" />
      )}
    </div>
    <div className="bg-white/80 backdrop-blur-sm border border-slate-100 shadow-sm rounded-xl p-2 mt-2 text-center w-full relative z-10">
      <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mb-0.5">{papel}</p>
      <h4 className="text-xs md:text-sm font-bold text-slate-800 leading-tight">{nome}</h4>
      {datas && <p className="text-[9px] md:text-[10px] text-slate-500 mt-1">{datas}</p>}
      
      {/* Botão de Documento se existir PDF */}
      {doc && (
        <a href={doc} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 bg-slate-800 text-white text-[9px] px-2 py-1 rounded-full hover:bg-slate-700 transition-colors">
          <FileText size={10} /> Ver Doc
        </a>
      )}
    </div>
  </div>
);

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================
export default function Genealogia() {
  const [activeTab, setActiveTab] = useState('arvore');
  const glassClasses = "bg-white/60 backdrop-blur-lg border border-white/50 shadow-sm rounded-3xl p-6";

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 relative z-50">
      
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
        
        <div className="bg-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <h2 className="text-3xl font-serif font-bold mb-2 relative z-10">Família Kovalek & Felipe</h2>
          <p className="text-slate-300 relative z-10 max-w-2xl leading-relaxed text-sm">
            Uma jornada que atravessa fronteiras, desde as terras da Galícia até Prudentópolis no Paraná.
          </p>
        </div>

        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <button onClick={() => setActiveTab('arvore')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'arvore' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <User size={16} /> Árvore Visual
          </button>
          <button onClick={() => setActiveTab('historia')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'historia' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <History size={16} /> Linha do Tempo
          </button>
          <button onClick={() => setActiveTab('curiosidades')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'curiosidades' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <FileText size={16} /> Curiosidades
          </button>
        </div>

        {/* ========================================== */}
        {/* ABA: ÁRVORE VISUAL                         */}
        {/* ========================================== */}
        {activeTab === 'arvore' && (
          <div className={`${glassClasses} overflow-x-auto pb-8`}>
            <div className="min-w-[800px] flex flex-col items-center pt-8">
              
              {/* LINHA 1: TETRAVÓS / TRISAVÓS (EUROPA) */}
              <div className="flex justify-around w-full relative">
                <MembroCard nome="Grzegorz Kowalyk & Anna" datas="Europa (Galícia)" papel="Trisavós" />
                <MembroCard nome="Andreas Zielinski" datas="1869-1919" foto="/images/andreaszielinski.png" papel="Trisavô" />
                <MembroCard nome="Nicolaus Pylypiw & Anna" datas="Europa" papel="Trisavós" />
                <MembroCard nome="Alexius Weresiuk & Maria" datas="Europa" papel="Trisavós" />
              </div>

              {/* CONECTORES LINHA 1 PARA 2 */}
              <div className="flex justify-around w-full h-8 relative">
                <div className="w-px h-full bg-slate-300 absolute left-[12%]"></div>
                <div className="w-px h-full bg-slate-300 absolute left-[38%]"></div>
                <div className="w-px h-full bg-slate-300 absolute left-[62%]"></div>
                <div className="w-px h-full bg-slate-300 absolute left-[88%]"></div>
                
                {/* Linhas horizontais unindo os casais */}
                <div className="absolute top-8 left-[12%] right-[38%] h-px bg-slate-300"></div>
                <div className="absolute top-8 left-[62%] right-[88%] h-px bg-slate-300"></div>
                
                {/* Linhas descendo para os Bisavós */}
                <div className="w-px h-8 bg-slate-300 absolute top-8 left-[25%]"></div>
                <div className="w-px h-8 bg-slate-300 absolute top-8 left-[75%]"></div>
              </div>

              {/* LINHA 2: BISAVÓS */}
              <div className="flex justify-around w-[80%] relative mt-8">
                <MembroCard nome="Paulo Kovalek" datas="1900-1967" papel="Bisavô" />
                <MembroCard nome="Anastacia Gelinski" datas="1912-1981" foto="/images/anastasiazielinski.png" papel="Bisavó" />
                <MembroCard nome="Theodoro Felipe" datas="1906-1991" doc="/docs/batismotheodorus.pdf" papel="Bisavô" />
                <MembroCard nome="Maria Veresiuk" datas="1906-1977" doc="/docs/batismomaria.pdf" papel="Bisavó" />
              </div>

              {/* CONECTORES LINHA 2 PARA 3 */}
              <div className="flex justify-around w-[80%] h-8 relative">
                <div className="w-px h-full bg-slate-300 absolute left-[15%]"></div>
                <div className="w-px h-full bg-slate-300 absolute left-[45%]"></div>
                <div className="w-px h-full bg-slate-300 absolute left-[55%]"></div>
                <div className="w-px h-full bg-slate-300 absolute left-[85%]"></div>
                
                {/* Linhas horizontais unindo os casais */}
                <div className="absolute top-8 left-[15%] right-[45%] h-px bg-slate-300"></div>
                <div className="absolute top-8 left-[55%] right-[85%] h-px bg-slate-300"></div>
                
                {/* Linhas descendo para os Avós */}
                <div className="w-px h-8 bg-slate-300 absolute top-8 left-[30%]"></div>
                <div className="w-px h-8 bg-slate-300 absolute top-8 left-[70%]"></div>
              </div>

              {/* LINHA 3: AVÓS */}
              <div className="flex justify-around w-[60%] relative mt-8">
                <MembroCard nome="Justina Kovalek" datas="1942-2015" foto="/images/justinakovalek.png" papel="Avó" />
                <MembroCard nome="Eleutério Felipe" datas="Nasc: 1945" foto="/images/EleuterioFelipe.jpeg" papel="Avô" />
              </div>

              {/* CONECTORES LINHA 3 PARA 4 */}
              <div className="flex justify-around w-[60%] h-8 relative">
                <div className="w-px h-full bg-slate-300 absolute left-[25%]"></div>
                <div className="w-px h-full bg-slate-300 absolute left-[75%]"></div>
                <div className="absolute top-8 left-[25%] right-[75%] h-px bg-slate-300"></div>
                <div className="w-px h-8 bg-slate-300 absolute top-8 left-[50%]"></div>
              </div>

              {/* LINHA 4: PAIS */}
              <div className="flex justify-center w-full relative mt-8">
                <div className="flex gap-16">
                  <MembroCard nome="Maria Juliana Felipe" datas="Nasc: 1980" papel="Mãe" />
                  <MembroCard nome="Saint-Clair Santos" datas="Nasc: 1975" papel="Pai" />
                </div>
              </div>

              {/* CONECTORES LINHA 4 PARA 5 */}
              <div className="flex justify-center w-full h-8 relative">
                <div className="w-px h-full bg-slate-300 absolute left-[45%]"></div>
                <div className="w-px h-full bg-slate-300 absolute left-[55%]"></div>
                <div className="absolute top-8 left-[45%] right-[55%] h-px bg-slate-300"></div>
                <div className="w-px h-8 bg-slate-300 absolute top-8 left-[50%]"></div>
              </div>

              {/* LINHA 5: ANA CLARA */}
              <div className="flex justify-center w-full relative mt-8 mb-4">
                <MembroCard nome="Ana Clara Kovalek" datas="Nasc: 2005" foto="/images/ana_e_eu_zoo.jpg" papel="Geração Atual" />
              </div>

            </div>
            <p className="text-center text-xs text-slate-400 mt-4 italic">Deslize para os lados para ver a árvore completa.</p>
          </div>
        )}

        {/* As outras abas continuam idênticas... */}
        {activeTab === 'historia' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
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
                  <span className="font-bold text-slate-800">Felipe</span>
                </li>
                <li className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-500 line-through decoration-rose-300">Kowalyk</span>
                  <span className="font-bold text-slate-800">Kovalek</span>
                </li>
                <li className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-500 line-through decoration-rose-300">Zieliński</span>
                  <span className="font-bold text-slate-800">Gelinski</span>
                </li>
                <li className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-500 line-through decoration-rose-300">Weresiuk</span>
                  <span className="font-bold text-slate-800">Veresiuk</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <History className="text-rose-400" size={20} /> O Império Austro-Húngaro
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                A Galícia Oriental era uma região multiétnica. Os registros dividem-se entre polonês, latim e ucraniano.
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