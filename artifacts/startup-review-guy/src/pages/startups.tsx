import { useState, useCallback } from "react";
import { useListStartups, useGetCategories } from "@workspace/api-client-react";
import { StartupCard } from "@/components/startup-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useLocation } from "wouter";

export function Startups() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [fundingStage, setFundingStage] = useState<string>("");

  const { data: categories } = useGetCategories();
  const { data, isLoading } = useListStartups({
    search: debouncedSearch || undefined,
    category: category || undefined,
    fundingStage: fundingStage || undefined,
    limit: 50
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Simple debounce simulation for immediate UI response
    setTimeout(() => setDebouncedSearch(e.target.value), 300);
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-12 md:py-24">
      <div className="mb-12 md:mb-16 text-center max-w-3xl mx-auto">
        <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tight mb-4 text-balance">The Startup Vault</h1>
        <p className="text-muted-foreground text-lg font-medium">Every tool, platform, and SaaS I've reviewed. Use the filters to find what you need.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-12 border-2 border-border p-4 bg-muted/30">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search by name, tag, or description..." 
            value={search}
            onChange={handleSearch}
            className="pl-10 h-12"
          />
        </div>
        
        <div className="flex gap-4">
          <select 
            className="h-12 border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary font-display uppercase tracking-widest font-bold w-full md:w-auto"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories?.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select 
            className="h-12 border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary font-display uppercase tracking-widest font-bold w-full md:w-auto"
            value={fundingStage}
            onChange={(e) => setFundingStage(e.target.value)}
          >
            <option value="">All Stages</option>
            <option value="Bootstrapped">Bootstrapped</option>
            <option value="Pre-Seed">Pre-Seed</option>
            <option value="Seed">Seed</option>
            <option value="Series A">Series A</option>
            <option value="Series B+">Series B+</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="border-2 border-border bg-card animate-pulse h-[400px]"></div>
          ))}
        </div>
      ) : data?.startups && data.startups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.startups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 border-2 border-dashed border-border bg-card">
          <h3 className="font-display text-2xl font-bold uppercase tracking-tight mb-2">No startups found</h3>
          <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
          <Button onClick={() => { setSearch(""); setDebouncedSearch(""); setCategory(""); setFundingStage(""); }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}