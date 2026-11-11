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
import SssPage from "@/pages/kuryeler/SssPage";
import UcretHesapla from "@/pages/kuryeler/UcretHesapla";

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
        <Route path="/kullanim-kosullari">{() => <LegalPage kind="kosullar" />}</Route>
        <Route path="/iletisim">{() => <LegalPage kind="iletisim" />}</Route>
        <Route path="/kunye">{() => <LegalPage kind="kunye" />}</Route>
        <Route path="/islem-rehberi">{() => <LegalPage kind="islem-rehberi" />}</Route>
        <Route path="/sss" component={SssPage} />
        <Route path="/ucret-hesapla" component={UcretHesapla} />
        <Route path="/cerez">{() => <LegalPage kind="cerez" />}</Route>
        <Route path="/on-bilgilendirme">{() => <LegalPage kind="on-bilgi" />}</Route>
        <Route path="/mesafeli-sozlesme">{() => <LegalPage kind="mesafeli" />}</Route>
        <Route path="/odeme-bilgisi">{() => <LegalPage kind="odeme-bilgisi" />}</Route>
        <Route path="/aracilik-ve-sikayet">{() => <LegalPage kind="aracilik" />}</Route>
        <Route path="/kurye-kullanici-sozlesmesi">{() => <LegalPage kind="kurye-soz" />}</Route>
        <Route path="/gonderici-sozlesmesi">{() => <LegalPage kind="gonderici-soz" />}</Route>
        <Route path="/eski">{() => { window.location.replace("/"); return null; }}</Route>
        <Route path="/eski/order">{() => { window.location.replace("/musteri/"); return null; }}</Route>
        <Route path="/eski/track">{() => { window.location.replace("/takip"); return null; }}</Route>
        <Route path="/order">{() => { window.location.replace("/musteri/"); return null; }}</Route>
        <Route path="/track">{() => { window.location.replace("/takip"); return null; }}</Route>
        <Route path="/demo" component={Demo} />
        <Route path="/ads-report" component={AdsReport} />
        <Route path="/courier-profile" component={CourierProfile} />
        <Route path="/membership" component={Membership} />
        <Route path="/admin-control" component={AdminControl} />
        <Route path="/chat">{() => { window.location.replace("/musteri/destek"); return null; }}</Route>
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
