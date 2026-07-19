import { useGetStartup } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StartupCard } from "@/components/startup-card";
import { ExternalLink, Twitter, Linkedin, Building, Calendar, ArrowLeft } from "lucide-react";
import { getGetStartupQueryKey } from "@workspace/api-client-react";

export function StartupDetail() {
  const { slug } = useParams();
  
  const { data: startup, isLoading } = useGetStartup(slug || "", { 
    query: { 
      enabled: !!slug,
      queryKey: getGetStartupQueryKey(slug || "")
    } 
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-12 animate-pulse">
        <div className="h-8 bg-muted w-32 mb-12"></div>
        <div className="h-[60vh] bg-muted w-full mb-12"></div>
        <div className="h-12 bg-muted w-2/3 mb-8"></div>
        <div className="h-4 bg-muted w-full mb-4"></div>
        <div className="h-4 bg-muted w-full mb-4"></div>
        <div className="h-4 bg-muted w-3/4 mb-4"></div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-32 text-center">
        <h1 className="font-display text-4xl font-black uppercase mb-4">Startup Not Found</h1>
        <p className="text-muted-foreground mb-8">The review you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/startups">Back to Vault</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="pb-24">
      {/* Header / Hero */}
      <div className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
          <Link href="/startups" className="inline-flex items-center text-sm font-display font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-10">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Vault
          </Link>
          
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-sm border-2 border-border bg-background flex-shrink-0 flex items-center justify-center overflow-hidden">
                {startup.logoUrl ? (
                  <img src={startup.logoUrl} alt={`${startup.name} logo`} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-4xl">{startup.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <h1 className="font-display text-4xl md:text-6xl font-black uppercase leading-none tracking-tight mb-2">
                  {startup.name}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl">{startup.tagline}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[200px]">
              {startup.websiteUrl && (
                <Button asChild className="w-full">
                  <a href={startup.websiteUrl} target="_blank" rel="norenoopener noreferrer">
                    Visit Website <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              )}
              <div className="flex items-center gap-2 justify-end">
                {startup.twitterUrl && (
                  <a href={startup.twitterUrl} target="_blank" rel="norenoopener noreferrer" className="p-2 border-2 border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {startup.linkedinUrl && (
                  <a href={startup.linkedinUrl} target="_blank" rel="norenoopener noreferrer" className="p-2 border-2 border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="default" className="text-sm px-3 py-1">{startup.category}</Badge>
            {startup.fundingStage && <Badge variant="outline" className="text-sm px-3 py-1 bg-background">{startup.fundingStage}</Badge>}
            {startup.tags?.map(tag => (
              <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">{tag}</Badge>
            ))}
          </div>
          
          <div className="text-sm font-display font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Reviewed on {format(new Date(startup.reviewedAt), "MMMM d, yyyy")}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Video & Review */}
          <div className="lg:col-span-2 space-y-12">
            <div className="aspect-video w-full border-2 border-border bg-black relative">
              <iframe
                src={`https://www.youtube.com/embed/${startup.youtubeVideoId}`}
                title={`${startup.name} Review Video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>

            <div className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tight">
              <h2>My Verdict</h2>
              <div className="bg-primary/5 border-l-4 border-primary p-6 my-6 text-xl font-medium not-prose text-foreground">
                {startup.verdict || "No final verdict provided yet."}
              </div>

              <h2>What is it?</h2>
              <p className="whitespace-pre-wrap">{startup.description}</p>
              
              {startup.useCase && (
                <>
                  <h2>Who is this for?</h2>
                  <p>{startup.useCase}</p>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Data & Stats */}
          <div className="space-y-8">
            {/* Intel Card */}
            <div className="border-2 border-border bg-card p-6">
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
                <Building className="w-6 h-6 text-primary" /> Company Intel
              </h3>
              
              <dl className="space-y-4 text-sm">
                {startup.totalRaised && (
                  <div className="flex flex-col border-b-2 border-border pb-4">
                    <dt className="text-muted-foreground font-display font-bold uppercase tracking-widest mb-1">Total Raised</dt>
                    <dd className="font-medium text-lg">{startup.totalRaised}</dd>
                  </div>
                )}
                {startup.lastRoundDate && (
                  <div className="flex flex-col border-b-2 border-border pb-4">
                    <dt className="text-muted-foreground font-display font-bold uppercase tracking-widest mb-1">Last Round</dt>
                    <dd className="font-medium text-lg">{startup.lastRoundDate}</dd>
                  </div>
                )}
                {startup.revenueArr && (
                  <div className="flex flex-col border-b-2 border-border pb-4">
                    <dt className="text-muted-foreground font-display font-bold uppercase tracking-widest mb-1">Revenue {startup.revenueEstimated ? '(Est.)' : ''}</dt>
                    <dd className="font-medium text-lg">{startup.revenueArr}</dd>
                  </div>
                )}
                {startup.notableInvestors && (
                  <div className="flex flex-col border-b-2 border-border pb-4">
                    <dt className="text-muted-foreground font-display font-bold uppercase tracking-widest mb-1">Notable Investors</dt>
                    <dd className="font-medium">{startup.notableInvestors}</dd>
                  </div>
                )}
                {startup.competitors && (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground font-display font-bold uppercase tracking-widest mb-1">Top Competitors</dt>
                    <dd className="font-medium">{startup.competitors}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Founders Card */}
            {startup.founders && startup.founders.length > 0 && (
              <div className="border-2 border-border bg-card p-6">
                <h3 className="font-display text-2xl font-bold uppercase tracking-tight mb-6">The Team</h3>
                <div className="space-y-6">
                  {startup.founders.map(founder => (
                    <div key={founder.id} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-2 border-border overflow-hidden bg-muted flex-shrink-0">
                        {founder.photoUrl ? (
                          <img src={founder.photoUrl} alt={founder.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-display font-bold">
                            {founder.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg leading-tight">{founder.name}</div>
                        {founder.role && <div className="text-sm text-muted-foreground">{founder.role}</div>}
                      </div>
                      {founder.linkedinUrl && (
                        <a href={founder.linkedinUrl} target="_blank" rel="norenoopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Startups */}
      {startup.relatedStartups && startup.relatedStartups.length > 0 && (
        <div className="border-t-2 border-border mt-12 bg-muted/20">
          <div className="container mx-auto px-4 md:px-8 py-16">
            <h2 className="font-display text-3xl font-black uppercase tracking-tight mb-8">Similar Tear-Downs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {startup.relatedStartups.map(related => (
                <StartupCard key={related.id} startup={related} />
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}