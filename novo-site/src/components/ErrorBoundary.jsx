import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erro ao carregar pagina:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white/85 p-6 text-center shadow-xl">
        <h1 className="font-serif text-3xl font-bold text-slate-900">Erro ao carregar o plano.</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
          Tente atualizar a pagina ou limpar cache.
        </p>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-h-48 overflow-auto rounded-2xl bg-red-50 p-3 text-left text-xs text-red-800">
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
        )}
      </section>
    );
  }
}
