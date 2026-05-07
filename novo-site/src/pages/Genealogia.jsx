import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, MapPin, History, FileText, Globe, Footprints, User, Download, ChevronRight, ChevronDown } from 'lucide-react';

// ==========================================
// DADOS DA ÁRVORE (CORRIGIDOS E MAPEADOS)
// ==========================================
// ==========================================
// DADOS DA ÁRVORE (EXPANDIDOS COM TRISAVÓS E TETRAVÓS)
// ==========================================
const arvoreData = {
  nome: "Ana Clara Kovalek Santos", datas: "2005-Viva", foto: "/images/ana_e_eu_zoo.jpg", papel: "Geração Atual", posicaoFoto: "object-top",
  pai: {
    nome: "Saint-Clair Santos", datas: "1975-Vivo", papel: "Pai",
    pai: {
      nome: "João de Jesus Santos", datas: "Vivo", papel: "Avô Paterno",
      pai: { 
        nome: "Venceslau dos Santos", datas: "1916-1986", papel: "Bisavô",
        pai: { nome: "João Francisco dos Santos", datas: "1890-1961", papel: "Trisavô" }
      },
      mae: { 
        nome: "Maria Candida Antunes", datas: "1916-1990", papel: "Bisavó",
        pai: { nome: "Salvador Antunes de Almeida", datas: "1880-1946", papel: "Trisavô" },
        mae: { nome: "Rosalina Santos Almeida", datas: "1884-Falecida", papel: "Trisavó" }
      }
    },
    mae: {
      nome: "Maria Ivonete de Jesus", datas: "1949-Viva", papel: "Avó Paterna",
      pai: { 
        nome: "João Lustózio De Jesus", datas: "1909-1978", papel: "Bisavô",
        pai: { nome: "Antonio Joaquim de Jesus", datas: "1874-1947", papel: "Trisavô" },
        mae: { nome: "Luiza Maria de Ramos", datas: "1881-1967", papel: "Trisavó" }
      },
      mae: { 
        nome: "Maria Sebastiana Amaral", datas: "1914-2008", papel: "Bisavó" 
      }
    }
  },
  mae: {
    nome: "Maria Juliana Felipe", datas: "1980-Viva", papel: "Mãe",
    pai: {
      nome: "Eleutério Felipe", datas: "1945-Vivo", foto: "/images/EleuterioFelipe.jpeg", papel: "Avô Materno", posicaoFoto: "object-top",
      pai: { 
        nome: "Theodoro Felipe", datas: "1906-1991", doc: "/docs/batismotheodorus.pdf", papel: "Bisavô",
        pai: { nome: "Nicolaus Pylypiw", datas: "Europa", papel: "Trisavô" }
      },
      mae: { 
        nome: "Maria Veresiuk", datas: "1906-1977", doc: "/docs/batismomaria.pdf", papel: "Bisavó",
        pai: { nome: "Alexius Weresiuk", datas: "Europa", doc: "/images/certidaonascimentoalexiusweresiuk.png", papel: "Trisavô" }
      }
    },
    mae: {
      nome: "Justina Kovalek", datas: "1942-2015", foto: "/images/justinakovalek.png", papel: "Avó Materna", posicaoFoto: "object-top",
      pai: { 
        nome: "Paulo Kovalek", datas: "1900-1967", foto: "/images/paulokovalek.jpg", papel: "Bisavô", posicaoFoto: "object-top",
        pai: { nome: "Gregorio Kovalek", datas: "Falecido", doc: "/docs/SanNicolauKowalyk.pdf", papel: "Trisavô" },
        mae: { nome: "Anastasia Petrusyk", datas: "Falecida", papel: "Trisavó" }
      },
      mae: { 
        nome: "Anastacia Gelinski", datas: "1912-1981", foto: "/images/anastasiazielinski.png", papel: "Bisavó", posicaoFoto: "object-top",
        pai: { 
          nome: "André Zielinski", datas: "1869-1919", doc: "/images/certidaonascimentoandreaszielinski.png", papel: "Trisavô",
          pai: { 
            nome: "Antonius Zielinski", datas: "1836-1891", papel: "Tetravô",
            pai: { nome: "Ignatius Zielinski", papel: "Pentavô" },
            mae: { nome: "Thecla Marcichow", papel: "Pentavó" }
          },
          mae: { nome: "Anna Chorostecka", datas: "1846-1890", papel: "Tetravó" }
        },
        mae: { 
          nome: "Natália Materacka", datas: "1880-1952", papel: "Trisavó",
          pai: { nome: "Jacobus Materacki", datas: "Falecido", papel: "Tetravô" },
          mae: { nome: "Euphemia Wysatyj", datas: "Falecida", papel: "Tetravó" }
        }
      }
    }
  }
};

// ==========================================
// COMPONENTE DE NÓ DA ÁRVORE (ESTILO FAMILYSEARCH)
// ==========================================
const NoArvore = ({ membro, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const temPais = membro.pai || membro.mae;

  return (
    <div className="flex items-center gap-6 my-2 relative">
      
      {/* O Cartão Horizontal */}
      <div className="relative z-10 flex items-center bg-white shadow-sm border border-slate-200 rounded-xl p-3 w-64 md:w-72 shrink-0">
        
        {/* Foto ou Ícone */}
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-100 border-2 border-rose-100 overflow-hidden flex items-center justify-center shrink-0">
          {membro.foto ? (
            <img src={membro.foto} alt={membro.nome} className={`w-full h-full object-cover ${membro.posicaoFoto || 'object-center'}`} />
          ) : (
            <User size={24} className="text-slate-400" />
          )}
        </div>
        
        {/* Informações */}
        <div className="ml-3 flex-1">
          <p className="text-[9px] text-rose-500 font-bold uppercase tracking-wider mb-0.5">{membro.papel}</p>
          <h4 className="text-xs md:text-sm font-bold text-slate-800 leading-tight truncate">{membro.nome}</h4>
          {membro.datas && <p className="text-[10px] text-slate-500 mt-0.5">{membro.datas}</p>}
          {membro.doc && (
            <a href={membro.doc} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 bg-slate-100 text-slate-600 font-medium text-[9px] px-2 py-0.5 rounded-full hover:bg-slate-200 transition-colors">
              <FileText size={10} /> Ver Doc
            </a>
          )}
        </div>

        {/* Botão de Expandir (A "Setinha") */}
        {temPais && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:bg-slate-50 text-slate-600 z-20 transition-transform hover:scale-110 cursor-pointer"
          >
            {expanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
          </button>
        )}
      </div>

      {/* Renderização Recursiva dos Pais com Linha de Conexão */}
      <AnimatePresence>
        {expanded && temPais && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 relative"
          >
            {/* A linha conectora que liga o cartão filho aos pais */}
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-[calc(100%-4rem)] border-l-2 border-t-2 border-b-2 border-slate-300 rounded-l-lg z-0"></div>
            
            {membro.pai && <NoArvore membro={membro.pai} defaultExpanded={false} />}
            {membro.mae && <NoArvore membro={membro.mae} defaultExpanded={false} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
          <h2 className="text-3xl font-serif font-bold mb-2 relative z-10">Famílias Santos, Felipe & Kovalek</h2>
          <p className="text-slate-300 relative z-10 max-w-2xl leading-relaxed text-sm">
            A convergência de histórias, desde a imigração europeia até à formação da nossa geração no Brasil.
          </p>
        </div>

        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <button onClick={() => setActiveTab('arvore')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'arvore' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <User size={16} /> Árvore Interativa
          </button>
          <button onClick={() => setActiveTab('historia')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'historia' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <History size={16} /> Linha do Tempo
          </button>
          <button onClick={() => setActiveTab('curiosidades')} className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'curiosidades' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <FileText size={16} /> Curiosidades
          </button>
        </div>

        {/* ========================================== */}
        {/* ABA: ÁRVORE INTERATIVA (ESTILO FAMILYSEARCH) */}
        {/* ========================================== */}
        {activeTab === 'arvore' && (
          <div className={`${glassClasses} overflow-x-auto pb-8`}>
            {/* O min-w-max permite que a árvore cresça infinitamente para a direita sem quebrar o layout */}
            <div className="min-w-max pt-4 pr-10">
              {/* O nó raiz (Ana Clara) vem com os pais expandidos por padrão */}
              <NoArvore membro={arvoreData} defaultExpanded={true} />
            </div>
            <p className="text-center text-xs text-slate-400 mt-8 italic">
              Clique nas setinhas para expandir as gerações anteriores. Deslize para a direita para ver mais.
            </p>
          </div>
        )}

        {/* ========================================== */}
        {/* ABA: LINHA DO TEMPO                        */}
        {/* ========================================== */}
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
              <div className="w-full">
                <span className="text-rose-500 font-bold text-sm">1890 a 1905</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1 mb-2">A Grande Imigração</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  As famílias deixam o Império Austro-Húngaro rumo ao Brasil, estabelecendo-se no Paraná. Em 1906, nascem os primeiros brasileiros desta linhagem: Theodoro e Maria.
                </p>
                <a href="/docs/ListaDeEmbarqueRioDeJaneiro.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer">
                  <Download size={16} /> Lista de Embarque (Rio de Janeiro)
                </a>
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

        {/* ========================================== */}
        {/* ABA: CURIOSIDADES                          */}
        {/* ========================================== */}
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
            
            {/* Certidão Extra */}
            <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Acervo: Stephanus Zielinski</h3>
                <p className="text-sm text-slate-500">Certidão de nascimento resgatada dos arquivos históricos europeus.</p>
              </div>
              <a href="/images/certidaonascimentostephanuszielinski.png" target="_blank" rel="noopener noreferrer" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors cursor-pointer">
                Ver Imagem
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}