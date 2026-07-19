import { StartupSummary } from "@workspace/api-client-react/src/generated/api.schemas";
import { Link } from "wouter";
import { format } from "date-fns";
import { Play } from "lucide-react";

export function StartupCard({ startup }: { startup: StartupSummary }) {
  const thumbnailUrl = `https://img.youtube.com/vi/${startup.youtubeVideoId}/mqdefault.jpg`;
  
  return (
    <Link href={`/startups/${startup.slug}`} className="group flex flex-col border-2 border-border bg-card hover:border-primary transition-colors duration-200">
      <div className="relative aspect-video overflow-hidden bg-muted border-b-2 border-border">
        <img 
          src={thumbnailUrl} 
          alt={`${startup.name} review`} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 ml-1" fill="currentColor" />
          </div>
        </div>
        <div className="absolute top-4 right-4 bg-background border-2 border-foreground px-3 py-1 text-xs font-display font-bold uppercase tracking-widest z-10">
          {startup.category}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-sm border-2 border-border bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
            {startup.logoUrl ? (
              <img src={startup.logoUrl} alt={`${startup.name} logo`} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-bold text-xl">{startup.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="font-display font-bold text-2xl uppercase leading-none mb-1 group-hover:text-primary transition-colors">{startup.name}</h3>
            {startup.fundingStage && (
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{startup.fundingStage}</span>
            )}
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm flex-1 mb-6 line-clamp-2">
          {startup.tagline}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-border/50 text-xs font-medium text-muted-foreground uppercase tracking-widest">
          <span>Reviewed</span>
          <span>{format(new Date(startup.reviewedAt), "MMM d, yyyy")}</span>
        </div>
      </div>
    </Link>
  );
}