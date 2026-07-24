import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setAuthTokenGetter, getGetSessionQueryKey } from '@workspace/api-client-react';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { Layout } from '@/components/layout';
import { supabase } from '@/lib/supabase';
import { trackPageView } from '@/lib/analytics';

import { Home } from '@/pages/home';
import { Startups } from '@/pages/startups';
import { StartupDetail } from '@/pages/startup-detail';
import { Partner } from '@/pages/partner';
import { AdminDashboard } from '@/pages/admin/index';
import { AdminStartupForm } from '@/pages/admin/startup-form';

const queryClient = new QueryClient();

// Every API request that opts into auth (see custom-fetch.ts) picks up the
// current Supabase access token as a bearer token, so requireAdmin on the
// server can verify it — this repo has no server-side session of its own.
setAuthTokenGetter(async () => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});

function useSupabaseSessionSync() {
  useEffect(() => {
    if (!supabase) return;
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() });
    });
    return () => subscription.subscription.unsubscribe();
  }, []);
}

function useAnalyticsPageViews() {
  const [location] = useLocation();
  useEffect(() => {
    trackPageView(location);
  }, [location]);
}

function Router() {
  useAnalyticsPageViews();

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
  useSupabaseSessionSync();

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