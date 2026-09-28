// Generated from the checked-in SQL migrations by npm run db:types. Do not edit.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Database = {
  public: {
    Tables: {
      checklist_items: {
        Row: {
          id: string;
          organization_id: string;
          checklist_id: string;
          title: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          organization_id: string;
          checklist_id: string;
          title: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          organization_id?: string;
          checklist_id?: string;
          title?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      checklist_run_items: {
        Row: {
          organization_id: string;
          checklist_id: string;
          run_id: string;
          item_id: string;
          completed_at: string | null;
        };
        Insert: {
          organization_id: string;
          checklist_id: string;
          run_id: string;
          item_id: string;
          completed_at?: string | null;
        };
        Update: {
          organization_id?: string;
          checklist_id?: string;
          run_id?: string;
          item_id?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      checklist_runs: {
        Row: {
          id: string;
          organization_id: string;
          checklist_id: string;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          checklist_id: string;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          checklist_id?: string;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      checklists: {
        Row: {
          id: string;
          organization_id: string;
          restaurant_id: string;
          title: string;
          kind: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          restaurant_id: string;
          title: string;
          kind?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          restaurant_id?: string;
          title?: string;
          kind?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          organization_id: string;
          restaurant_id: string;
          user_id: string | null;
          full_name: string;
          position: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          restaurant_id: string;
          user_id?: string | null;
          full_name: string;
          position?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          restaurant_id?: string;
          user_id?: string | null;
          full_name?: string;
          position?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role_id?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      menu_categories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          organization_id: string;
          category_id: string;
          name: string;
          description: string;
          price: number;
          currency: string;
          allergens: string[];
          available: boolean;
        };
        Insert: {
          id?: string;
          organization_id: string;
          category_id: string;
          name: string;
          description?: string;
          price?: number;
          currency?: string;
          allergens?: string[];
          available?: boolean;
        };
        Update: {
          id?: string;
          organization_id?: string;
          category_id?: string;
          name?: string;
          description?: string;
          price?: number;
          currency?: string;
          allergens?: string[];
          available?: boolean;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          key: string;
          description: string;
        };
        Insert: {
          key: string;
          description: string;
        };
        Update: {
          key?: string;
          description?: string;
        };
        Relationships: [];
      };
      restaurants: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          timezone: string;
          address: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          timezone?: string;
          address?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          timezone?: string;
          address?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          organization_id: string;
          role_id: string;
          permission_key: string;
        };
        Insert: {
          organization_id: string;
          role_id: string;
          permission_key: string;
        };
        Update: {
          organization_id?: string;
          role_id?: string;
          permission_key?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          key: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          key: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          key?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          organization_id: string;
          restaurant_id: string;
          assignee_id: string | null;
          title: string;
          description: string;
          status: string;
          priority: string;
          due_at: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          restaurant_id: string;
          assignee_id?: string | null;
          title: string;
          description?: string;
          status?: string;
          priority?: string;
          due_at?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          restaurant_id?: string;
          assignee_id?: string | null;
          title?: string;
          description?: string;
          status?: string;
          priority?: string;
          due_at?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      test_attempts: {
        Row: {
          id: string;
          organization_id: string;
          test_id: string;
          employee_id: string;
          score: number | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          test_id: string;
          employee_id: string;
          score?: number | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          test_id?: string;
          employee_id?: string;
          score?: number | null;
          submitted_at?: string;
        };
        Relationships: [];
      };
      test_questions: {
        Row: {
          id: string;
          organization_id: string;
          test_id: string;
          prompt: string;
          options: Json;
          sort_order: number;
        };
        Insert: {
          id?: string;
          organization_id: string;
          test_id: string;
          prompt: string;
          options?: Json;
          sort_order?: number;
        };
        Update: {
          id?: string;
          organization_id?: string;
          test_id?: string;
          prompt?: string;
          options?: Json;
          sort_order?: number;
        };
        Relationships: [];
      };
      tests: {
        Row: {
          id: string;
          organization_id: string;
          training_id: string;
          title: string;
          passing_score: number;
        };
        Insert: {
          id?: string;
          organization_id: string;
          training_id: string;
          title: string;
          passing_score?: number;
        };
        Update: {
          id?: string;
          organization_id?: string;
          training_id?: string;
          title?: string;
          passing_score?: number;
        };
        Relationships: [];
      };
      training: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          content: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          content?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          content?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      training_progress: {
        Row: {
          id: string;
          organization_id: string;
          training_id: string;
          employee_id: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          training_id: string;
          employee_id: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          training_id?: string;
          employee_id?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          display_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      has_permission: {
        Args: { org_id: string; permission: string };
        Returns: boolean;
      };
      create_organization: {
        Args: { organization_name: string; restaurant_name: string };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
