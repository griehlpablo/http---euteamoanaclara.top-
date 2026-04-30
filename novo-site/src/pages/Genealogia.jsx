import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, GitMerge, Search } from 'lucide-react';

export default function Genealogia() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-serif text-4xl font-bold mb-4 text-gray-800 flex items-center justify-center gap-3">
          <GitMerge className="text-brand" /> Dossiê Genealógico
        </h2>
        <p className="text-slate-500 italic">A reconstrução documental das origens de Ana Clara e Pablo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-8 rounded-3xl border-t-4 border-t-amber-700">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-4">Galícia 🇦🇹</span>
          <h3 className="font-serif text-2xl font-bold mb-2">Kovalek, Griehl & Pylypiw</h3>
          <p className="text-slate-600 text-sm mb-4">
            A espinha dorsal da árvore. Uma família greco-católica originária de Hulcze. A imigração ocorreu em 1908 a bordo do vapor <em>San Nicolas</em>, trazendo Gregorio, Anna, Iwan e Paulo Kovalek para o Brasil.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border-t-4 border-t-red-700">
          <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full mb-4">Império Russo 🇷🇺</span>
          <h3 className="font-serif text-2xl font-bold mb-2">A Linha Veresiuk</h3>
          <p className="text-slate-600 text-sm mb-4">
            A maior reviravolta militar da pesquisa. Anton Veretiuk foi soldado da cavalaria do 3º Regimento de Ulanos de Bug. Seu filho Andrei foi Bombardeiro da Artilharia, e o neto Alexandre imigrou para Prudentópolis, Paraná.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border-t-4 border-t-blue-700">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-4">Polônia 🇵🇱</span>
          <h3 className="font-serif text-2xl font-bold mb-2">Zieliński, Materacka & Felipe</h3>
          <p className="text-slate-600 text-sm mb-4">
            A "Certidão de Ouro" revelou a grafia correta Materacka. Documentos civis provaram que Theodoro Felipe nasceu na Comarca de Prudentópolis em 1905, confirmando que estas famílias habitavam o mesmo núcleo colonial.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border-t-4 border-t-green-700">
          <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full mb-4">Brasil 🇧🇷</span>
          <h3 className="font-serif text-2xl font-bold mb-2">Lado Paterno & Ferramentas</h3>
          <p className="text-slate-600 text-sm mb-4">
            As linhas de Saint-Clair Santos, com João Francisco dos Santos e Luiza Maria de Ramos.
          </p>
          <div className="flex gap-2 mt-4">
             <a href="https://www.familysearch.org/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-white px-3 py-2 rounded-lg border shadow-sm hover:text-brand"><Search className="w-3 h-3"/> FamilySearch</a>
             <a href="https://sian.an.gov.br/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-white px-3 py-2 rounded-lg border shadow-sm hover:text-brand"><Search className="w-3 h-3"/> SIAN</a>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/central" className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Menu
        </Link>
      </div>
    </motion.div>
  );
}