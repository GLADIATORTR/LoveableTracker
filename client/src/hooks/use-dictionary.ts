import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Temporary dictionary types until full implementation
interface DictionaryEntry {
  id: string;
  term: string;
  definition: string;
  category?: string;
  examples?: string[];
  tags?: string[];
}

interface DictionaryEntryWithCategory extends DictionaryEntry {
  category?: { id: string; name: string; color: string; };
}

interface InsertDictionaryEntry {
  term: string;
  definition: string;
  category?: string;
  examples?: string[];
  tags?: string[];
}

export function useDictionaryEntries(filters?: { categoryId?: string; search?: string }) {
  const queryKey = ["/api/dictionary", filters];
  
  return useQuery<DictionaryEntryWithCategory[]>({
    queryKey,
    enabled: true,
  });
}

export function useDictionaryEntry(id: string) {
  return useQuery<DictionaryEntryWithCategory>({
    queryKey: ["/api/dictionary", id],
    enabled: !!id,
  });
}

export function useCreateDictionaryEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertDictionaryEntry) => {
      const response = await apiRequest("POST", "/api/dictionary", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dictionary"] });
    },
  });
}

export function useUpdateDictionaryEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertDictionaryEntry> }) => {
      const response = await apiRequest("PATCH", `/api/dictionary/${id}`, data);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dictionary", id] });
    },
  });
}

export function useDeleteDictionaryEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/dictionary/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dictionary"] });
    },
  });
}
