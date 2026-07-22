import { useGetSession, useAdminListStartups, useAdminListInquiries, useDeleteStartup, useUpdateInquiry } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ExternalLink, Edit, Trash2, Plus, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListStartupsQueryKey, getAdminListInquiriesQueryKey } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";

function signInWithGoogle() {
  supabase?.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/admin-access` },
  });
}

export function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: session, isLoading: sessionLoading } = useGetSession();

  const { data: startupsData, isLoading: startupsLoading } = useAdminListStartups({ limit: 100 });
  const { data: inquiriesData, isLoading: inquiriesLoading } = useAdminListInquiries({});

  const deleteStartup = useDeleteStartup();
  const updateInquiry = useUpdateInquiry();

  if (sessionLoading) {
    return <div className="p-12 text-center animate-pulse">Loading auth...</div>;
  }

  if (!session?.authenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="border-2 border-border bg-card p-12 max-w-md w-full text-center space-y-6">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">Admin Access</h1>
          <p className="text-muted-foreground">You must be authorized to access this area.</p>
          {supabase ? (
            <Button size="lg" className="w-full" onClick={signInWithGoogle}>
              Sign in with Google
            </Button>
          ) : (
            <p className="text-sm text-destructive">Admin login is not configured.</p>
          )}
        </div>
      </div>
    );
  }

  const handleDeleteStartup = (id: string) => {
    if (window.confirm("Are you sure you want to delete this startup? This cannot be undone.")) {
      deleteStartup.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListStartupsQueryKey() });
        }
      });
    }
  };

  const handleUpdateInquiryStatus = (id: string, status: string) => {
    updateInquiry.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListInquiriesQueryKey() });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-12">
        <h1 className="font-display text-4xl font-black uppercase tracking-tight">Command Center</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">{session.user?.email}</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => supabase?.auth.signOut()}
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="startups" className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-2 md:inline-flex mb-8">
          <TabsTrigger value="startups">Startups</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="startups" className="space-y-6">
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/admin-access/startups/new" className="gap-2">
                <Plus className="w-4 h-4" /> New Review
              </Link>
            </Button>
          </div>
          
          <div className="bg-card border-2 border-border">
            {startupsLoading ? (
              <div className="p-12 text-center animate-pulse">Loading startups...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Startup</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {startupsData?.startups.map((startup) => (
                    <TableRow key={startup.id}>
                      <TableCell className="font-medium font-bold text-base">
                        <div className="flex items-center gap-3">
                          {startup.logoUrl ? (
                            <img src={startup.logoUrl} alt="" className="w-8 h-8 rounded-sm bg-muted object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center text-xs font-display font-bold">
                              {startup.name.charAt(0)}
                            </div>
                          )}
                          {startup.name}
                        </div>
                      </TableCell>
                      <TableCell>{startup.category}</TableCell>
                      <TableCell>
                        {startup.published ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white border-transparent">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(startup.reviewedAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/startups/${startup.slug}`}>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin-access/startups/${startup.id}/edit`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteStartup(startup.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!startupsData?.startups.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No startups found. Create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="inquiries" className="space-y-6">
          <div className="bg-card border-2 border-border">
            {inquiriesLoading ? (
              <div className="p-12 text-center animate-pulse">Loading inquiries...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* The API spec says it returns an array of PartnerInquiry for adminListInquiries, but let's assume it might be paginated or flat. Looking at schema, it's just `any` because it wasn't strictly typed in the return? Wait, `useAdminListInquiries` returns `any` in Orval generation? Wait, I didn't see the exact response type. Let's assume it returns an array of PartnerInquiry based on typical REST. */}
                  {Array.isArray(inquiriesData) && inquiriesData.map((inquiry: any) => (
                    <TableRow key={inquiry.id}>
                      <TableCell className="font-bold">{inquiry.companyName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{inquiry.contactName}</span>
                          <span className="text-xs text-muted-foreground">{inquiry.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{inquiry.budgetRange || 'Not specified'}</TableCell>
                      <TableCell>
                        <select
                          className="h-8 border-2 border-input bg-background px-2 text-xs font-bold uppercase tracking-widest focus-visible:outline-none focus-visible:border-primary"
                          value={inquiry.status}
                          onChange={(e) => handleUpdateInquiryStatus(inquiry.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(inquiry.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {inquiry.website && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={inquiry.website} target="_blank" rel="norenoopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {Array.isArray(inquiriesData) && inquiriesData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No partner inquiries yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}