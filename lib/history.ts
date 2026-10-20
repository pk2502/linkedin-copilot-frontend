import api from "@/lib/axios";

export interface Generation {
  id: number;
  generation_type: string;
  input_data: Record<string, string | number>;
  output: string;
  /** Three options for drafts from /api/drafts/, one for a tweak, empty for older generations. */
  variants: string[];
  /** Set on tweaks: the draft that was rewritten. */
  parent: number | null;
  created_at: string;
}

export const historyService = {
  list: async (search?: string): Promise<Generation[]> => {
    const params = search ? { search } : {};
    const { data } = await api.get<Generation[]>("/api/history/", { params });
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/history/${id}/`);
  },
};
