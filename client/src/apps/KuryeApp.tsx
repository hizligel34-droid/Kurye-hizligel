import AuthPage from "@/pages/kuryeler/AuthPage";
import CourierPanel from "@/pages/kuryeler/CourierPanel";
import NotFound from "@/pages/NotFound";
import { Route, Router, Switch } from "wouter";

export function KuryeApp() {
  return (
    <Router base="/kurye">
      <Switch>
        <Route path="/" component={CourierPanel} />
        <Route path="/giris">{() => <AuthPage mode="giris" panel="kurye" />}</Route>
        <Route path="/kayit">{() => <AuthPage mode="kayit" panel="kurye" />}</Route>
        <Route>{() => <NotFound homeHref="/" homeLabel="İşlerim" />}</Route>
      </Switch>
    </Router>
  );
}
