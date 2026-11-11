import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] p-8 text-base leading-[1.5] text-[#f5edd6]">
          <div className="flex w-full max-w-lg flex-col items-center rounded-3xl border border-[#3a3014] p-8 text-center">
            <AlertTriangle size={48} className="mb-6 flex-shrink-0 text-[#D4AF37]" aria-hidden />
            <h2 className="mb-4 text-xl font-black">Beklenmeyen bir hata oluştu.</h2>
            <p className="mb-6 text-base leading-[1.5] text-[#8a7c52]">
              Sayfayı yenilemeyi deneyin. Sorun sürerse serif.tekin@hotmail.com adresine yazın.
            </p>
            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl px-4 py-2",
                "bg-[#D4AF37] font-bold text-black hover:opacity-90",
              )}
            >
              <RotateCcw size={16} />
              Sayfayı yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
