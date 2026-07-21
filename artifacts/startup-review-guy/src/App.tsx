import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { Layout } from '@/components/layout';

import { Home } from '@/pages/home';
import { Startups } from '@/pages/startups';
import { StartupDetail } from '@/pages/startup-detail';
import { Partner } from '@/pages/partner';
import { AdminDashboard } from '@/pages/admin/index';
import { AdminStartupForm } from '@/pages/admin/startup-form';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/startups" component={Startups} />
        <Route path="/startups/:slug" component={StartupDetail} />
        <Route path="/partner" component={Partner} />
        
        {/* Admin Routes */}
        <Route path="/admin-access" component={AdminDashboard} />
        <Route path="/admin-access/startups/new" component={AdminStartupForm} />
        <Route path="/admin-access/startups/:id/edit" component={AdminStartupForm} />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="srg-theme">
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;