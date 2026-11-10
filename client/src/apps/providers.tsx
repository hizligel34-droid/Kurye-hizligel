import { PwaManager } from "@/components/kuryeler/PwaManager";
import { Seo } from "@/components/kuryeler/Seo";
import ErrorBoundary from "@/components/ErrorBoundary";
import { KuryelerAuthProvider } from "@/contexts/KuryelerAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import type { UserRole } from "@shared/kuryeler";
import type { PwaPanel } from "@shared/kuryelerPwa";
import type { ReactNode } from "react";

export function AppProviders({
  children,
  panel,
  lockedRole,
}: {
  children: ReactNode;
  panel: PwaPanel;
  lockedRole: UserRole;
}) {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <KuryelerAuthProvider lockedRole={lockedRole}>
          <TooltipProvider>
            <PwaManager panel={panel} />
            <Seo panel={panel} />
            <Toaster />
            {children}
          </TooltipProvider>
        </KuryelerAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
