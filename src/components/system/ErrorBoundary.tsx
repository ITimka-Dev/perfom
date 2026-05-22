import React from "react";

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console so it's visible in Preview DevTools
    console.error("App crashed:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
            <p className="text-muted-foreground text-sm">
              Мы уже записали ошибку в консоль. Попробуйте обновить страницу.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium bg-background hover:bg-muted transition"
            >
              Перезагрузить
            </button>
            {this.state.error && (
              <details className="text-left mt-4 p-3 rounded-md bg-muted text-xs whitespace-pre-wrap">
                {this.state.error.message}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
