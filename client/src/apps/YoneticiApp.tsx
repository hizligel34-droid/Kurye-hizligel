import AuthPage from "@/pages/kuryeler/AuthPage";
import AdminPanel from "@/pages/kuryeler/AdminPanel";
import NotFound from "@/pages/NotFound";
import { Route, Router, Switch } from "wouter";

export function YoneticiApp() {
  return (
    <Router base="/yonetici">
      <Switch>
        <Route path="/" component={AdminPanel} />
        <Route path="/giris">{() => <AuthPage mode="giris" panel="yonetici" />}</Route>
        <Route>{() => <NotFound homeHref="/" homeLabel="Yönetim" />}</Route>
      </Switch>
    </Router>
  );
}
