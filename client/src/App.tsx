import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Demo from "./pages/Demo";

function Router() {
  return <Switch><Route path="/" component={Home}/><Route path="/order" component={Home}/><Route path="/track" component={Home}/><Route path="/demo" component={Demo}/><Route path="/chat" component={Home}/><Route path="/panel" component={Home}/><Route path="/account" component={Home}/><Route path="/404" component={NotFound}/><Route component={NotFound}/></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster/><Router/></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
