'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reportError } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center"
          role="alert"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">حدث خطأ غير متوقع</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              نعتذر عن هذا الإزعاج. يرجى تحديث الصفحة أو المحاولة لاحقاً.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleReset}>
              <RefreshCw className="ml-2 h-4 w-4" />
              إعادة المحاولة
            </Button>
            <Button onClick={() => window.location.reload()}>تحديث الصفحة</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
