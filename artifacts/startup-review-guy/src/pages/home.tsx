import { useGetFeaturedStartups, useGetStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { StartupCard } from "@/components/startup-card";
import { ArrowRight, PlayCircle, Handshake, Target, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Home() {
  const { data: stats } = useGetStats();
  const { data: featuredStartups, isLoading: isLoadingFeatured } = useGetFeaturedStartups();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden border-b-2 border-border">
        {/* Abstract background noise/pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')] z-0 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-foreground bg-foreground text-background font-display font-bold uppercase tracking-widest text-xs md:text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              New reviews weekly
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tighter mb-8 text-balance">
              I review new startups <span className="text-primary italic">so you don't have to.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed mb-12">
              10+ years building software. Now I rip apart the latest tools, SaaS, and platforms to find what's actually worth your time and money. No fluff, just the verdict.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Button asChild size="lg" className="w-full sm:w-auto text-lg">
                <Link href="/startups">
                  Browse Startups <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg bg-transparent">
                <Link href="/partner">Partner With Me</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {stats && (
        <section className="border-b-2 border-border bg-card">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x-0 md:divide-x-2 divide-y-2 md:divide-y-0 divide-border border-x-0 md:border-x-2 border-border">
              <div className="p-8 flex flex-col items-center text-center">
                <span className="font-display text-4xl md:text-5xl font-black text-primary mb-2">{stats.totalReviews}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Startups Reviewed</span>
              </div>
              <div className="p-8 flex flex-col items-center text-center">
                <span className="font-display text-4xl md:text-5xl font-black text-primary mb-2">{stats.totalCategories}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Categories Covered</span>
              </div>
              <div className="p-8 flex flex-col items-center text-center">
                <span className="font-display text-4xl md:text-5xl font-black text-primary mb-2">{stats.totalViews ? (stats.totalViews / 1000000).toFixed(1) + 'M+' : '2.4M+'}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Views</span>
              </div>
              <div className="p-8 flex flex-col items-center text-center">
                <span className="font-display text-4xl md:text-5xl font-black text-primary mb-2">{stats.subscriberCount ? (stats.subscriberCount / 1000).toFixed(0) + 'K+' : '150K+'}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subscribers</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Startups Grid */}
      <section className="py-24 border-b-2 border-border">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">Latest Tear-Downs</h2>
              <p className="text-muted-foreground font-medium max-w-md">The most recent platforms I've put through the wringer.</p>
            </div>
            <Button asChild variant="outline" className="hidden md:flex">
              <Link href="/startups">View All Reviews</Link>
            </Button>
          </div>

          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="border-2 border-border bg-card animate-pulse h-[400px]"></div>
              ))}
            </div>
          ) : (
            <>
              {featuredStartups && featuredStartups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredStartups.map((startup) => (
                    <StartupCard key={startup.id} startup={startup} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-border">
                  <p className="text-muted-foreground font-display uppercase tracking-widest">No startups featured yet.</p>
                </div>
              )}
            </>
          )}
          
          <div className="mt-12 md:hidden">
            <Button asChild variant="outline" className="w-full">
              <Link href="/startups">View All Reviews</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy / Vibe Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight mb-16 text-center">My Review Philosophy</h2>
            
            <div className="space-y-12">
              <div className="flex gap-6">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-none border-2 border-primary flex items-center justify-center shrink-0">
                  <Target className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold uppercase mb-2">No Sugar-Coating</h3>
                  <p className="text-muted-foreground leading-relaxed">If a product is bad, I say it's bad. If it's a clone of something better, I call it out. The value I provide is honesty, not being a hype-man for mediocre software.</p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-none border-2 border-primary flex items-center justify-center shrink-0">
                  <Rocket className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold uppercase mb-2">Built for Builders</h3>
                  <p className="text-muted-foreground leading-relaxed">I look at products through the lens of a developer. I care about APIs, documentation, performance, and architecture, not just flashy marketing pages.</p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-none border-2 border-primary flex items-center justify-center shrink-0">
                  <Handshake className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold uppercase mb-2">Transparent Sponsorships</h3>
                  <p className="text-muted-foreground leading-relaxed">When a review is sponsored, you'll know in the first 10 seconds. But paying me doesn't buy a positive review — it only buys my time to look at the product.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <Button asChild size="lg">
                <Link href="/partner">Pitch Your Startup</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}