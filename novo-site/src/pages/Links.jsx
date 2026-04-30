import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Link as LinkIcon, ExternalLink } from 'lucide-react';

export default function Links() {
  const links = [
    { title: "Nossa Playlist", url: "https://open.spotify.com/playlist/3RitDlOniO6hRIQxmLWrMw", desc: "A trilha sonora do nosso amor no Spotify." },
    { title: "Drive de Fotos", url: "#", desc: "Backup em alta qualidade das nossas fotos." },
    { title: "Nossos Documentos", url: "#", desc: "Planilhas de viagens e organização da casa." }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="glass-panel p-8 rounded-3xl">
        <h2 className="font-serif text-3xl font-bold mb-2 text-gray-800 flex items-center gap-3">
          <LinkIcon className="text-brand" /> Links Úteis
        </h2>
        <p className="text-slate-500 mb-8">Nossas referências rápidas e acessos diários.</p>

        <div className="space-y-4">
          {links.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-brand-light hover:shadow-md transition-all group">
              <div>
                <h4 className="font-bold text-slate-800">{link.title}</h4>
                <p className="text-sm text-slate-500">{link.desc}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-brand" />
            </a>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <RouterLink to="/central" className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Menu
        </RouterLink>
      </div>
    </motion.div>
  );
}