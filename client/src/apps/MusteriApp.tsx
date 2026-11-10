import AuthPage from "@/pages/kuryeler/AuthPage";
import AccountPage from "@/pages/kuryeler/AccountPage";
import CustomerPanel from "@/pages/kuryeler/CustomerPanel";
import DestekPage from "@/pages/kuryeler/DestekPage";
import TrackPage from "@/pages/kuryeler/TrackPage";
import NotFound from "@/pages/NotFound";
import { Route, Router, Switch } from "wouter";

export function MusteriApp() {
  return (
    <Router base="/musteri">
      <Switch>
        <Route path="/" component={CustomerPanel} />
        <Route path="/giris">{() => <AuthPage mode="giris" panel="musteri" />}</Route>
        <Route path="/kayit">{() => <AuthPage mode="kayit" panel="musteri" />}</Route>
        <Route path="/takip" component={TrackPage} />
        <Route path="/takip/:code" component={TrackPage} />
        <Route path="/destek" component={DestekPage} />
        <Route path="/hesap" component={AccountPage} />
        <Route>{() => <NotFound homeHref="/" homeLabel="Siparişlerim" />}</Route>
      </Switch>
    </Router>
  );
}
