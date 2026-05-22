export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          condition_type: string | null
          condition_value: number | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          rarity: Database["public"]["Enums"]["achievement_rarity"] | null
          title: string
        }
        Insert: {
          condition_type?: string | null
          condition_value?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          rarity?: Database["public"]["Enums"]["achievement_rarity"] | null
          title: string
        }
        Update: {
          condition_type?: string | null
          condition_value?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          rarity?: Database["public"]["Enums"]["achievement_rarity"] | null
          title?: string
        }
        Relationships: []
      }
      comment_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      farm_animals: {
        Row: {
          created_at: string | null
          description: string | null
          feed_item_id: string | null
          icon_emoji: string
          id: string
          max_happiness: number | null
          name: string
          production_item_id: string
          production_time: number
          unlock_tasks_required: number | null
          zone_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feed_item_id?: string | null
          icon_emoji: string
          id?: string
          max_happiness?: number | null
          name: string
          production_item_id: string
          production_time: number
          unlock_tasks_required?: number | null
          zone_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feed_item_id?: string | null
          icon_emoji?: string
          id?: string
          max_happiness?: number | null
          name?: string
          production_item_id?: string
          production_time?: number
          unlock_tasks_required?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_animals_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "farm_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_animals_production_item_id_fkey"
            columns: ["production_item_id"]
            isOneToOne: false
            referencedRelation: "farm_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_animals_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "farm_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          created_at: string | null
          description: string | null
          icon_emoji: string
          id: string
          name: string
          production_time: number | null
          sell_price_npc: number | null
          unlock_tasks_required: number | null
          zone_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          created_at?: string | null
          description?: string | null
          icon_emoji: string
          id?: string
          name: string
          production_time?: number | null
          sell_price_npc?: number | null
          unlock_tasks_required?: number | null
          zone_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          created_at?: string | null
          description?: string | null
          icon_emoji?: string
          id?: string
          name?: string
          production_time?: number | null
          sell_price_npc?: number | null
          unlock_tasks_required?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_items_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "farm_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_zones: {
        Row: {
          allowed_slot_types: string[] | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          unlock_level: number | null
          zone_type: Database["public"]["Enums"]["zone_type"]
        }
        Insert: {
          allowed_slot_types?: string[] | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          unlock_level?: number | null
          zone_type: Database["public"]["Enums"]["zone_type"]
        }
        Update: {
          allowed_slot_types?: string[] | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          unlock_level?: number | null
          zone_type?: Database["public"]["Enums"]["zone_type"]
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_tasks: {
        Row: {
          assigned_at: string
          due_date: string | null
          group_id: string
          id: string
          task_id: string
        }
        Insert: {
          assigned_at?: string
          due_date?: string | null
          group_id: string
          id?: string
          task_id: string
        }
        Update: {
          assigned_at?: string
          due_date?: string | null
          group_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_shop_item_costs: {
        Row: {
          created_at: string | null
          id: string
          quantity_needed: number
          required_item_id: string
          shop_item_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          quantity_needed?: number
          required_item_id: string
          shop_item_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          quantity_needed?: number
          required_item_id?: string
          shop_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_shop_item_costs_required_item_id_fkey"
            columns: ["required_item_id"]
            isOneToOne: false
            referencedRelation: "farm_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_shop_item_costs_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "pet_shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_shop_items: {
        Row: {
          created_at: string | null
          description: string | null
          icon_emoji: string
          id: string
          is_consumable: boolean | null
          item_type: string
          name: string
          stat_effect_happiness: number | null
          stat_effect_hunger: number | null
          stat_effect_thirst: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_emoji: string
          id?: string
          is_consumable?: boolean | null
          item_type: string
          name: string
          stat_effect_happiness?: number | null
          stat_effect_hunger?: number | null
          stat_effect_thirst?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_emoji?: string
          id?: string
          is_consumable?: boolean | null
          item_type?: string
          name?: string
          stat_effect_happiness?: number | null
          stat_effect_hunger?: number | null
          stat_effect_thirst?: number | null
        }
        Relationships: []
      }
      pets: {
        Row: {
          created_at: string
          happiness: number
          hunger: number
          id: string
          last_fed_at: string
          last_played_at: string
          last_watered_at: string
          name: string
          ran_away_at: string | null
          thirst: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          happiness?: number
          hunger?: number
          id?: string
          last_fed_at?: string
          last_played_at?: string
          last_watered_at?: string
          name: string
          ran_away_at?: string | null
          thirst?: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          happiness?: number
          hunger?: number
          id?: string
          last_fed_at?: string
          last_played_at?: string
          last_watered_at?: string
          name?: string
          ran_away_at?: string | null
          thirst?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      production_chain_ingredients: {
        Row: {
          chain_id: string
          id: string
          item_id: string
          quantity_needed: number
        }
        Insert: {
          chain_id: string
          id?: string
          item_id: string
          quantity_needed: number
        }
        Update: {
          chain_id?: string
          id?: string
          item_id?: string
          quantity_needed?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_chain_ingredients_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "production_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_chain_ingredients_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "farm_items"
            referencedColumns: ["id"]
          },
        ]
      }
      production_chains: {
        Row: {
          base_time: number
          created_at: string | null
          id: string
          name: string
          output_item_id: string
          output_quantity: number | null
          unlock_tasks_required: number | null
          zone_id: string
        }
        Insert: {
          base_time: number
          created_at?: string | null
          id?: string
          name: string
          output_item_id: string
          output_quantity?: number | null
          unlock_tasks_required?: number | null
          zone_id: string
        }
        Update: {
          base_time?: number
          created_at?: string | null
          id?: string
          name?: string
          output_item_id?: string
          output_quantity?: number | null
          unlock_tasks_required?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_chains_output_item_id_fkey"
            columns: ["output_item_id"]
            isOneToOne: false
            referencedRelation: "farm_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_chains_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "farm_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          grade: number | null
          id: string
          school_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          grade?: number | null
          id: string
          school_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          grade?: number | null
          id?: string
          school_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      student_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      submission_comments: {
        Row: {
          comment_text: string
          created_at: string
          file_urls: string[] | null
          id: string
          submission_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          file_urls?: string[] | null
          id?: string
          submission_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          file_urls?: string[] | null
          id?: string
          submission_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "task_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          file_urls: string[] | null
          grade: number | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submission_text: string | null
          submitted_at: string | null
          task_id: string
          teacher_feedback: string | null
          user_id: string
        }
        Insert: {
          file_urls?: string[] | null
          grade?: number | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          task_id: string
          teacher_feedback?: string | null
          user_id: string
        }
        Update: {
          file_urls?: string[] | null
          grade?: number | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          task_id?: string
          teacher_feedback?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          attachment_urls: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: number | null
          experience_reward: number | null
          id: string
          instructions: string | null
          required_level: number | null
          target_grades: number[] | null
          title: string
          updated_at: string | null
          zone_id: string
        }
        Insert: {
          attachment_urls?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: number | null
          experience_reward?: number | null
          id?: string
          instructions?: string | null
          required_level?: number | null
          target_grades?: number[] | null
          title: string
          updated_at?: string | null
          zone_id: string
        }
        Update: {
          attachment_urls?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: number | null
          experience_reward?: number | null
          id?: string
          instructions?: string | null
          required_level?: number | null
          target_grades?: number[] | null
          title?: string
          updated_at?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "farm_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          created_at: string | null
          id: string
          teacher_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          teacher_id: string
          zone_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          teacher_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "farm_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_active_boosters: {
        Row: {
          activated_at: string | null
          booster_id: string
          can_activate_again_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          booster_id: string
          can_activate_again_at: string
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          booster_id?: string
          can_activate_again_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_boosters_booster_id_fkey"
            columns: ["booster_id"]
            isOneToOne: false
            referencedRelation: "zone_boosters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_farm_animals: {
        Row: {
          animal_id: string
          created_at: string | null
          happiness: number | null
          id: string
          last_collected_at: string | null
          last_fed_at: string | null
          user_id: string
        }
        Insert: {
          animal_id: string
          created_at?: string | null
          happiness?: number | null
          id?: string
          last_collected_at?: string | null
          last_fed_at?: string | null
          user_id: string
        }
        Update: {
          animal_id?: string
          created_at?: string | null
          happiness?: number | null
          id?: string
          last_collected_at?: string | null
          last_fed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_farm_animals_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "farm_animals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_farm_slots: {
        Row: {
          id: string
          slot_type: Database["public"]["Enums"]["slot_type"]
          unlocked_count: number | null
          user_id: string
          zone_id: string
        }
        Insert: {
          id?: string
          slot_type: Database["public"]["Enums"]["slot_type"]
          unlocked_count?: number | null
          user_id: string
          zone_id: string
        }
        Update: {
          id?: string
          slot_type?: Database["public"]["Enums"]["slot_type"]
          unlocked_count?: number | null
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_farm_slots_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "farm_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          id: string
          item_id: string
          quantity: number | null
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          quantity?: number | null
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          quantity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "farm_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pet_items: {
        Row: {
          id: string
          item_id: string
          purchased_at: string | null
          quantity: number | null
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          purchased_at?: string | null
          quantity?: number | null
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          purchased_at?: string | null
          quantity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pet_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "pet_shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plants: {
        Row: {
          created_at: string | null
          id: string
          needs_water: boolean | null
          planted_at: string
          seed_item_id: string
          slot_index: number
          user_id: string
          watered_at: string | null
          zone_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          needs_water?: boolean | null
          planted_at?: string
          seed_item_id: string
          slot_index: number
          user_id: string
          watered_at?: string | null
          zone_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          needs_water?: boolean | null
          planted_at?: string
          seed_item_id?: string
          slot_index?: number
          user_id?: string
          watered_at?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plants_seed_item_id_fkey"
            columns: ["seed_item_id"]
            isOneToOne: false
            referencedRelation: "farm_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plants_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "farm_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_productions: {
        Row: {
          chain_id: string
          created_at: string | null
          finish_at: string
          id: string
          slot_index: number
          started_at: string | null
          user_id: string
          zone_id: string
        }
        Insert: {
          chain_id: string
          created_at?: string | null
          finish_at: string
          id?: string
          slot_index: number
          started_at?: string | null
          user_id: string
          zone_id: string
        }
        Update: {
          chain_id?: string
          created_at?: string | null
          finish_at?: string
          id?: string
          slot_index?: number
          started_at?: string | null
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_productions_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "production_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_productions_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "farm_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_zone_progress: {
        Row: {
          created_at: string | null
          experience: number | null
          id: string
          is_unlocked: boolean | null
          level: number | null
          tasks_completed: number | null
          updated_at: string | null
          user_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string | null
          experience?: number | null
          id?: string
          is_unlocked?: boolean | null
          level?: number | null
          tasks_completed?: number | null
          updated_at?: string | null
          user_id: string
          zone_id: string
        }
        Update: {
          created_at?: string | null
          experience?: number | null
          id?: string
          is_unlocked?: boolean | null
          level?: number | null
          tasks_completed?: number | null
          updated_at?: string | null
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_zone_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_zone_progress_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "farm_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          created_at: string
          id: string
          report_data: Json
          teacher_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_data: Json
          teacher_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          report_data?: Json
          teacher_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      zone_boosters: {
        Row: {
          cooldown: number
          created_at: string | null
          description: string | null
          duration: number
          id: string
          name: string
          speed_multiplier: number | null
          unlock_achievement_id: string | null
          zone_id: string
        }
        Insert: {
          cooldown: number
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          name: string
          speed_multiplier?: number | null
          unlock_achievement_id?: string | null
          zone_id: string
        }
        Update: {
          cooldown?: number
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          name?: string
          speed_multiplier?: number | null
          unlock_achievement_id?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_boosters_unlock_achievement_id_fkey"
            columns: ["unlock_achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_boosters_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "farm_zones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      achievement_rarity: "common" | "rare" | "epic" | "legendary"
      app_role: "student" | "teacher" | "admin"
      item_category: "seed" | "raw" | "product" | "feed" | "booster"
      slot_type: "plant" | "animal" | "production"
      trade_status: "listed" | "sold" | "cancelled"
      zone_type:
        | "physics"
        | "biology"
        | "chemistry"
        | "mathematics"
        | "it"
        | "math"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      achievement_rarity: ["common", "rare", "epic", "legendary"],
      app_role: ["student", "teacher", "admin"],
      item_category: ["seed", "raw", "product", "feed", "booster"],
      slot_type: ["plant", "animal", "production"],
      trade_status: ["listed", "sold", "cancelled"],
      zone_type: [
        "physics",
        "biology",
        "chemistry",
        "mathematics",
        "it",
        "math",
      ],
    },
  },
} as const
