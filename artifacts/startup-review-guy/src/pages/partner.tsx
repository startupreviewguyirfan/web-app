import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitPartnerInquiry } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Handshake, Zap, ShieldAlert } from "lucide-react";

const partnerSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  budgetRange: z.string().min(1, "Please select a budget range"),
  message: z.string().min(20, "Tell me a bit more about what you're building"),
  honeypot: z.string().max(0, "Spam detected").optional() // Hidden field
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

export function Partner() {
  const { toast } = useToast();
  const submitInquiry = useSubmitPartnerInquiry();
  
  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      website: "",
      budgetRange: "",
      message: "",
      honeypot: ""
    }
  });

  const onSubmit = (data: PartnerFormValues) => {
    // Basic bot protection
    if (data.honeypot) return;
    
    submitInquiry.mutate({ data }, {
      onSuccess: () => {
        toast({
          title: "Inquiry Received",
          description: "I'll take a look and get back to you within 48 hours.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          title: "Submission Failed",
          description: "Something went wrong. Please try again or reach out on X/Twitter.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-12 md:py-24 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* Pitch Side */}
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tight mb-6">Let's Break Down Your Product</h1>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed">
              I do deep-dive, no-BS video reviews of tools that developers and founders care about. If you've built something good, let's show it to the world.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="border-2 border-border bg-card p-6 flex gap-4">
              <div className="text-primary mt-1"><Zap className="w-6 h-6" /></div>
              <div>
                <h3 className="font-display font-bold uppercase tracking-widest mb-2 text-lg">High-Intent Audience</h3>
                <p className="text-muted-foreground">My audience consists of founders, developers, and tech early adopters actively looking for new tools to solve their problems.</p>
              </div>
            </div>
            
            <div className="border-2 border-border bg-card p-6 flex gap-4">
              <div className="text-primary mt-1"><ShieldAlert className="w-6 h-6" /></div>
              <div>
                <h3 className="font-display font-bold uppercase tracking-widest mb-2 text-lg">The "No Fluff" Guarantee</h3>
                <p className="text-muted-foreground">Paying for a review guarantees my time to evaluate your product and create a dedicated video. It does <strong>not</strong> guarantee a positive review. I highlight the good and the bad.</p>
              </div>
            </div>
            
            <div className="border-2 border-border bg-card p-6 flex gap-4">
              <div className="text-primary mt-1"><Handshake className="w-6 h-6" /></div>
              <div>
                <h3 className="font-display font-bold uppercase tracking-widest mb-2 text-lg">Full Rights Included</h3>
                <p className="text-muted-foreground">You get full rights to use clips from the review in your own marketing, ads, and landing pages forever.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Side */}
        <div className="border-2 border-border bg-card p-8 md:p-10 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-border bg-muted/50 translate-x-2 -translate-y-2 -z-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 border-r-2 border-t-2 border-border bg-muted/50 -translate-x-2 translate-y-2 -z-10"></div>
          
          <h2 className="font-display text-3xl font-black uppercase tracking-tight mb-8 border-b-2 border-border pb-4">Submit Your Startup</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Honeypot field - hidden from users */}
              <div className="hidden" aria-hidden="true">
                <FormField
                  control={form.control}
                  name="honeypot"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl><Input {...field} tabIndex={-1} autoComplete="off" /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company/Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@acme.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="budgetRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marketing Budget Range</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-12 w-full border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="" disabled>Select a range</option>
                        <option value="<$5K">&lt; $5,000</option>
                        <option value="$5K-$15K">$5,000 - $15,000</option>
                        <option value="$15K-$30K">$15,000 - $30,000</option>
                        <option value="$30K+">$30,000+</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>The Pitch</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What does it do? Who is it for? Why is it better than the alternatives? Don't use marketing speak." 
                        className="min-h-[150px] resize-y"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                size="lg" 
                className="w-full text-lg h-14"
                disabled={submitInquiry.isPending}
              >
                {submitInquiry.isPending ? "Submitting..." : "Send Pitch"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}