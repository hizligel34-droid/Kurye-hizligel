import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Seo } from "@/components/kuryeler/Seo";
import { KuryelerAuthProvider } from "@/contexts/KuryelerAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import NotFound from "@/pages/NotFound";
import { LoadingState } from "@/components/kuryeler/UiStates";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import Landing from "@/pages/kuryeler/Landing";
import TrackPage from "@/pages/kuryeler/TrackPage";
import LegalPage from "@/pages/kuryeler/LegalPage";

const Home = lazy(() => import("./pages/Home"));
const Demo = lazy(() => import("@/pages/Demo"));
const AdsReport = lazy(() => import("@/pages/AdsReport"));
const CourierProfile = lazy(() => import("@/pages/CourierProfile"));
const Membership = lazy(() => import("@/pages/Membership"));
const AdminControl = lazy(() => import("@/pages/AdminControl"));

function Router() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingState /></div>}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/takip" component={TrackPage} />
        <Route path="/takip/:code" component={TrackPage} />
        <Route path="/kvkk">{() => <LegalPage kind="kvkk" />}</Route>
        <Route path="/kosullar">{() => <LegalPage kind="kosullar" />}</Route>
        <Route path="/eski" component={Home} />
        <Route path="/eski/order" component={Home} />
        <Route path="/eski/track" component={Home} />
        <Route path="/order" component={Home} />
        <Route path="/track" component={Home} />
        <Route path="/demo" component={Demo} />
        <Route path="/ads-report" component={AdsReport} />
        <Route path="/courier-profile" component={CourierProfile} />
        <Route path="/membership" component={Membership} />
        <Route path="/admin-control" component={AdminControl} />
        <Route path="/chat" component={Home} />
        <Route path="/panel" component={Home} />
        <Route path="/account" component={Home} />
        <Route path="/404">{() => <NotFound />}</Route>
        <Route>{() => <NotFound />}</Route>
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <KuryelerAuthProvider>
          <TooltipProvider>
            <Seo />
            <Toaster />
            <Router />
          </TooltipProvider>
        </KuryelerAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
