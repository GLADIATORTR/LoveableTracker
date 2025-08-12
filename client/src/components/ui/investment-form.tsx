import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";
import { z } from "zod";
import { insertRealEstateInvestmentSchema, type InsertRealEstateInvestment, type Category, type RealEstateInvestmentWithCategory } from "@shared/schema";

// Create a simpler form schema for the UI
const formSchema = insertRealEstateInvestmentSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  purchaseDate: insertRealEstateInvestmentSchema.shape.purchaseDate.transform(date => 
    typeof date === 'string' ? date : date.toISOString().split('T')[0]
  ),
});

type FormData = {
  propertyName: string;
  address: string;
  propertyType: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  monthlyRent: number;
  monthlyExpenses: number;
  netEquity: number;
  loanAmount?: number;
  interestRate?: number;
  loanTerm?: number;
  monthlyMortgage?: number;
  outstandingBalance?: number;
  currentTerm?: number;
  description?: string;
  categoryId?: string;
};

const propertyTypes = [
  "Single Family",
  "Condo", 
  "Multi-Family",
  "Townhouse",
  "Commercial",
  "Land",
  "Other"
];

interface InvestmentFormProps {
  onSuccess?: () => void;
  existingInvestment?: RealEstateInvestmentWithCategory | null;
  onClose?: () => void;
}

export function InvestmentForm({ onSuccess, existingInvestment, onClose }: InvestmentFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<FormData>({
    defaultValues: existingInvestment ? {
      propertyName: existingInvestment.propertyName,
      address: existingInvestment.address,
      propertyType: existingInvestment.propertyType,
      purchasePrice: existingInvestment.purchasePrice / 100,
      currentValue: existingInvestment.currentValue / 100,
      purchaseDate: typeof existingInvestment.purchaseDate === 'string' 
        ? existingInvestment.purchaseDate.split('T')[0] 
        : existingInvestment.purchaseDate.toISOString().split('T')[0],
      monthlyRent: existingInvestment.monthlyRent / 100,
      monthlyExpenses: existingInvestment.monthlyExpenses / 100,
      netEquity: existingInvestment.netEquity / 100,
      loanAmount: existingInvestment.loanAmount ? existingInvestment.loanAmount / 100 : 0,
      interestRate: existingInvestment.interestRate ? existingInvestment.interestRate / 100 : 0,
      loanTerm: existingInvestment.loanTerm || 0,
      monthlyMortgage: existingInvestment.monthlyMortgage ? existingInvestment.monthlyMortgage / 100 : 0,
      outstandingBalance: existingInvestment.outstandingBalance ? existingInvestment.outstandingBalance / 100 : 0,
      currentTerm: existingInvestment.currentTerm || 0,
      description: existingInvestment.notes || "",
    } : {
      propertyName: "",
      address: "",
      propertyType: "Single Family",
      purchasePrice: 0,
      currentValue: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      monthlyRent: 0,
      monthlyExpenses: 0,
      netEquity: 0,
      loanAmount: 0,
      interestRate: 0,
      loanTerm: 0,
      monthlyMortgage: 0,
      outstandingBalance: 0,
      currentTerm: 0,
      description: "",
    },
    resolver: zodResolver(z.object({
      propertyName: z.string().min(1, "Property name is required"),
      address: z.string().min(1, "Address is required"),
      propertyType: z.string(),
      purchasePrice: z.number().min(0, "Purchase price must be positive"),
      currentValue: z.number().min(0, "Current value must be positive"),
      purchaseDate: z.string(),
      monthlyRent: z.number().min(0, "Monthly rent must be positive"),
      monthlyExpenses: z.number().min(0, "Monthly expenses must be positive"),
      netEquity: z.number(),
      loanAmount: z.number().min(0).optional(),
      interestRate: z.number().min(0).optional(),
      loanTerm: z.number().min(0).optional(),
      monthlyMortgage: z.number().min(0).optional(),
      outstandingBalance: z.number().min(0).optional(),
      currentTerm: z.number().min(0).optional(),
      description: z.string().optional(),
    })),
  });

  // Handle editing mode
  useEffect(() => {
    if (existingInvestment) {
      setOpen(true);
      form.reset({
        propertyName: existingInvestment.propertyName,
        address: existingInvestment.address,
        propertyType: existingInvestment.propertyType,
        purchasePrice: existingInvestment.purchasePrice / 100,
        currentValue: existingInvestment.currentValue / 100,
        purchaseDate: typeof existingInvestment.purchaseDate === 'string' 
          ? existingInvestment.purchaseDate.split('T')[0] 
          : existingInvestment.purchaseDate.toISOString().split('T')[0],
        monthlyRent: existingInvestment.monthlyRent / 100,
        monthlyExpenses: existingInvestment.monthlyExpenses / 100,
        netEquity: existingInvestment.netEquity / 100,
        description: existingInvestment.description || "",
        categoryId: existingInvestment.categoryId?.toString() || "",
      });
    }
  }, [existingInvestment, form]);

  const saveInvestment = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        purchasePrice: Math.round(data.purchasePrice * 100), // Convert to cents
        currentValue: Math.round(data.currentValue * 100),
        monthlyRent: Math.round(data.monthlyRent * 100),
        monthlyExpenses: Math.round(data.monthlyExpenses * 100),
        netEquity: Math.round(data.netEquity * 100),
        purchaseDate: new Date(data.purchaseDate),
      };

      const url = existingInvestment ? `/api/investments/${existingInvestment.id}` : "/api/investments";
      const method = existingInvestment ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Failed to ${existingInvestment ? 'update' : 'create'} investment`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: existingInvestment ? "Investment Updated" : "Investment Added",
        description: `Real estate investment has been ${existingInvestment ? 'updated' : 'added'} successfully.`,
      });
      form.reset();
      setOpen(false);
      onSuccess?.();
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${existingInvestment ? 'update' : 'add'} investment. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    saveInvestment.mutate(data);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {!existingInvestment && (
        <DialogTrigger asChild>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Investment
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <DialogHeader>
          <DialogTitle>
            {existingInvestment ? 'Edit' : 'Add'} Real Estate Investment
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="propertyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lupin Way Property" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="Property address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="monthlyRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="monthlyExpenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Expenses</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="netEquity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Net Equity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Loan Information Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Loan Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="loanAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="loanTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Term (months)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="360" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="monthlyMortgage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Mortgage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="outstandingBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outstanding Balance</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currentTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Term (months)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {categories && categories.length > 0 && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this investment..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saveInvestment.isPending}
              >
                {saveInvestment.isPending 
                  ? (existingInvestment ? "Updating..." : "Adding...") 
                  : (existingInvestment ? "Update Investment" : "Add Investment")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}