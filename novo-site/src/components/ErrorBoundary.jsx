import { Component } from 'react';
import { APP_CACHE_VERSION, buildDiagnosticText, clearAppCachesAndReload } from '../lib/healthPlanDiagnostics';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erro ao carregar pagina:', error, info);
    this.setState({ info });
  }

  clearLocalPlanData() {
    const path = window.location.pathname;
    const prefix = path.startsWith('/planohelena') ? 'planohelena_' : 'diet_';
    const ok = window.confirm(`Remover dados locais com prefixo ${prefix}? Dados ja salvos no Supabase nao serao apagados.`);
    if (!ok) return;
    Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => localStorage.removeItem(key));
    window.location.href = `${path}?v=${Date.now()}`;
  }

  async copyDiagnostic() {
    const plan = window.location.pathname.startsWith('/planohelena') ? 'Helena' : 'casal';
    const prefix = plan === 'Helena' ? 'planohelena_' : 'diet_';
    const text = buildDiagnosticText({
      plan,
      localStoragePrefix: prefix,
      appVersion: APP_CACHE_VERSION,
      error: {
        message: this.state.error?.message || String(this.state.error),
        stack: this.state.error?.stack || '',
      },
      componentStack: this.state.info?.componentStack || '',
    });
    await navigator.clipboard.writeText(text);
    this.setState({ copied: true });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const plan = window.location.pathname.startsWith('/planohelena') ? 'Helena' : 'casal';
    const prefix = plan === 'Helena' ? 'planohelena_' : 'diet_';
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-red-100 bg-white/90 p-6 shadow-xl">
        <h1 className="font-serif text-3xl font-bold text-slate-900">Erro ao carregar o plano.</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-slate-600">A interface segura carregou o diagnostico para nao esconder o erro real.</p>
        <div className="mt-4 grid gap-2 rounded-2xl bg-red-50 p-4 text-left text-xs font-bold text-red-900 sm:grid-cols-2">
          <span>Rota: {window.location.pathname}</span>
          <span>Plano: {plan}</span>
          <span>Prefixo localStorage: {prefix}</span>
          <span>Versao/cache: {APP_CACHE_VERSION}</span>
          <span>Service worker ativo: {navigator.serviceWorker?.controller ? 'sim' : 'nao'}</span>
          <span>Erro: {this.state.error?.message || String(this.state.error)}</span>
        </div>
        <details className="mt-4 rounded-2xl bg-slate-950 p-4 text-left text-xs text-slate-100">
          <summary className="cursor-pointer font-bold">Detalhes tecnicos</summary>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap">{String(this.state.error?.stack || this.state.error?.message || this.state.error)}</pre>
          {this.state.info?.componentStack && <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap">{this.state.info.componentStack}</pre>}
        </details>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => window.location.reload()} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Tentar novamente</button>
          <button onClick={() => clearAppCachesAndReload(window.location.pathname)} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">Limpar cache e recarregar</button>
          <button onClick={() => this.clearLocalPlanData()} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-red-700 shadow-sm">Limpar dados locais deste plano</button>
          <button onClick={() => this.copyDiagnostic()} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">{this.state.copied ? 'Diagnostico copiado' : 'Copiar diagnostico'}</button>
        </div>
      </section>
    );
  }
}
