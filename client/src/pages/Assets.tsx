import { useState } from "react";
import { useAssets } from "@/hooks/use-assets";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Plus, Package, FileText, Download } from "lucide-react";
import type { Category } from "@shared/schema";

function formatCurrency(cents?: number | null): string {
  if (!cents) return "-";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatDate(date?: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

const statusColors = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
  maintenance: "bg-warning/10 text-warning",
  disposed: "bg-destructive/10 text-destructive",
};

export default function Assets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: assets, isLoading, error } = useAssets({
    search: searchQuery || undefined,
    categoryId: categoryFilter || undefined,
    status: statusFilter || undefined,
  });

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load assets</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assets</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all your organizational assets in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 focus-ring"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Asset Inventory
            {assets && (
              <Badge variant="secondary" className="ml-2">
                {assets.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : assets?.length ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id} className="hover:bg-accent/50 cursor-pointer">
                      <TableCell>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          {asset.model && (
                            <div className="text-sm text-muted-foreground">
                              {asset.manufacturer && `${asset.manufacturer} `}{asset.model}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {asset.category && (
                          <Badge 
                            variant="secondary"
                            style={{ 
                              backgroundColor: `${asset.category.color}20`,
                              color: asset.category.color,
                              borderColor: `${asset.category.color}40`
                            }}
                          >
                            {asset.category.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={statusColors[asset.status as keyof typeof statusColors] || statusColors.active}
                        >
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {asset.location || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(asset.purchaseDate)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(asset.currentValue || asset.purchasePrice)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {asset.assignedTo || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No assets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter || statusFilter
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first asset"}
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add First Asset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
