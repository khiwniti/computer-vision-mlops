import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Building, Truck, Globe, Key, Phone, Mail } from "lucide-react";
import { useState } from "react";

export default function Vendors() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['/api/vendors'],
    refetchInterval: 30000,
  });

  const filteredVendors = vendors?.filter((vendor: any) => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-500';
      case 'inactive':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          title="Vendors" 
          subtitle="Manage external service providers and API integrations"
        />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeVendors = vendors?.filter((vendor: any) => vendor.status === 'active').length || 0;
  const totalVendors = vendors?.length || 0;
  const totalTrucks = vendors?.reduce((sum: number, vendor: any) => sum + (vendor.trucksCount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Vendors" 
        subtitle="Manage external service providers and API integrations"
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="text-primary" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Total Vendors</p>
                  <p className="text-2xl font-bold">{totalVendors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="text-green-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Active Vendors</p>
                  <p className="text-2xl font-bold text-green-500">{activeVendors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Total Trucks</p>
                  <p className="text-2xl font-bold text-blue-500">{totalTrucks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Globe className="text-orange-500" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">API Integrations</p>
                  <p className="text-2xl font-bold text-orange-500">{activeVendors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          </div>
          
          <Button>
            <Plus size={16} className="mr-2" />
            Add Vendor
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor: any) => (
            <Card key={vendor.id} className="bg-card border-border hover:border-border/60 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Building className="text-primary-foreground" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{vendor.contactPerson}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(vendor.status)}>
                    {vendor.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Trucks</p>
                    <p className="text-lg font-semibold">{vendor.trucksCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">API Status</p>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${vendor.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm">{vendor.status === 'active' ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {vendor.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone size={14} className="text-muted-foreground" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail size={14} className="text-muted-foreground" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.apiEndpoint && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Globe size={14} className="text-muted-foreground" />
                      <span className="truncate">{vendor.apiEndpoint}</span>
                    </div>
                  )}
                  {vendor.apiKey && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Key size={14} className="text-muted-foreground" />
                      <span className="font-mono">••••••••••••{vendor.apiKey.slice(-4)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <Building size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No vendors found</p>
          </div>
        )}
      </div>
    </div>
  );
}
