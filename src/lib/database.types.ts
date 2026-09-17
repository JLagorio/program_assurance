export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      activity_events: {
        Row: {
          actor_party_id: string | null;
          assessment_campaign_id: string | null;
          changes: Json | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          event_type: string;
          evidence_artifact_id: string | null;
          id: string;
          issue_id: string | null;
          occurred_at: string;
          package_id: string | null;
          poam_item_id: string | null;
          program_id: string | null;
          requirement_revision_id: string | null;
          revision: number;
          risk_id: string | null;
          source_requirement_revision_id: string | null;
          task_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          actor_party_id?: string | null;
          assessment_campaign_id?: string | null;
          changes?: Json | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          event_type: string;
          evidence_artifact_id?: string | null;
          id?: string;
          issue_id?: string | null;
          occurred_at: string;
          package_id?: string | null;
          poam_item_id?: string | null;
          program_id?: string | null;
          requirement_revision_id?: string | null;
          revision?: number;
          risk_id?: string | null;
          source_requirement_revision_id?: string | null;
          task_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          actor_party_id?: string | null;
          assessment_campaign_id?: string | null;
          changes?: Json | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          event_type?: string;
          evidence_artifact_id?: string | null;
          id?: string;
          issue_id?: string | null;
          occurred_at?: string;
          package_id?: string | null;
          poam_item_id?: string | null;
          program_id?: string | null;
          requirement_revision_id?: string | null;
          revision?: number;
          risk_id?: string | null;
          source_requirement_revision_id?: string | null;
          task_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_events_tenant_id_actor_party_id_fkey";
            columns: ["tenant_id", "actor_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "activity_events_tenant_id_assessment_campaign_id_fkey";
            columns: ["tenant_id", "assessment_campaign_id"];
            isOneToOne: false;
            referencedRelation: "assessment_campaigns";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "activity_events_tenant_id_evidence_artifact_id_fkey";
            columns: ["tenant_id", "evidence_artifact_id"];
            isOneToOne: false;
            referencedRelation: "evidence_artifacts";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "activity_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_events_tenant_id_issue_id_fkey";
            columns: ["tenant_id", "issue_id"];
            isOneToOne: false;
            referencedRelation: "operational_issues";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "activity_events_tenant_id_package_id_fkey";
            columns: ["tenant_id", "package_id"];
            isOneToOne: false;
            referencedRelation: "authorization_packages";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "activity_events_tenant_id_poam_item_id_fkey";
            columns: ["tenant_id", "poam_item_id"];
            isOneToOne: false;
            referencedRelation: "poam_items";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "activity_events_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "activity_events_tenant_id_requirement_revision_id_fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "activity_events_tenant_id_risk_id_fkey";
            columns: ["tenant_id", "risk_id"];
            isOneToOne: false;
            referencedRelation: "risks";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "activity_events_tenant_id_source_requirement_revision_id_fkey";
            columns: ["tenant_id", "source_requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "activity_events_tenant_id_task_id_fkey";
            columns: ["tenant_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      activity_steps: {
        Row: {
          activity_id: string;
          created_at: string;
          created_by: string | null;
          expected_result: string | null;
          id: string;
          instruction: string;
          plan_revision_id: string;
          revision: number;
          sequence_number: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          created_by?: string | null;
          expected_result?: string | null;
          id?: string;
          instruction: string;
          plan_revision_id: string;
          revision?: number;
          sequence_number: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          created_by?: string | null;
          expected_result?: string | null;
          id?: string;
          instruction?: string;
          plan_revision_id?: string;
          revision?: number;
          sequence_number?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_steps_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_steps_tenant_id_plan_revision_id_activity_id_fkey";
            columns: ["tenant_id", "plan_revision_id", "activity_id"];
            isOneToOne: false;
            referencedRelation: "assessment_activities";
            referencedColumns: ["tenant_id", "plan_revision_id", "id"];
          },
          {
            foreignKeyName: "activity_steps_tenant_id_plan_revision_id_fkey";
            columns: ["tenant_id", "plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      assessment_activities: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          method: string;
          objective_id: string | null;
          plan_revision_id: string;
          revision: number;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          method: string;
          objective_id?: string | null;
          plan_revision_id: string;
          revision?: number;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          method?: string;
          objective_id?: string | null;
          plan_revision_id?: string;
          revision?: number;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_activities_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_activities_tenant_id_plan_revision_id_fkey";
            columns: ["tenant_id", "plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_activities_tenant_id_plan_revision_id_objective_fkey";
            columns: ["tenant_id", "plan_revision_id", "objective_id"];
            isOneToOne: false;
            referencedRelation: "assessment_objectives";
            referencedColumns: ["tenant_id", "plan_revision_id", "id"];
          },
        ];
      };
      assessment_campaigns: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          owner_party_id: string | null;
          program_id: string;
          revision: number;
          scope_id: string | null;
          starts_at: string | null;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id: string;
          revision?: number;
          scope_id?: string | null;
          starts_at?: string | null;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id?: string;
          revision?: number;
          scope_id?: string | null;
          starts_at?: string | null;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_campaigns_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_campaigns_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_campaigns_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_campaigns_tenant_id_scope_id_fkey";
            columns: ["tenant_id", "scope_id"];
            isOneToOne: false;
            referencedRelation: "scopes";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      assessment_events: {
        Row: {
          campaign_id: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          location: string | null;
          plan_revision_id: string;
          revision: number;
          starts_at: string | null;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          campaign_id: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          location?: string | null;
          plan_revision_id: string;
          revision?: number;
          starts_at?: string | null;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          campaign_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          location?: string | null;
          plan_revision_id?: string;
          revision?: number;
          starts_at?: string | null;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_events_tenant_id_campaign_id_fkey";
            columns: ["tenant_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "assessment_campaigns";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_events_tenant_id_campaign_id_plan_revision_id_fkey";
            columns: ["tenant_id", "campaign_id", "plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "campaign_id", "id"];
          },
          {
            foreignKeyName: "assessment_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_events_tenant_id_plan_revision_id_fkey";
            columns: ["tenant_id", "plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      assessment_findings: {
        Row: {
          assessment_results_revision_id: string;
          assessor_party_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          determination: string;
          determined_at: string | null;
          id: string;
          result_set_id: string;
          revision: number;
          target_control_part_id: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_results_revision_id: string;
          assessor_party_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          determination: string;
          determined_at?: string | null;
          id?: string;
          result_set_id: string;
          revision?: number;
          target_control_part_id: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_results_revision_id?: string;
          assessor_party_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          determination?: string;
          determined_at?: string | null;
          id?: string;
          result_set_id?: string;
          revision?: number;
          target_control_part_id?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_findings_target_control_part_id_fkey";
            columns: ["target_control_part_id"];
            isOneToOne: false;
            referencedRelation: "control_parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_findings_tenant_id_assessment_results_revision__fkey";
            columns: ["tenant_id", "assessment_results_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_results_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_findings_tenant_id_assessment_results_revision_fkey1";
            columns: ["tenant_id", "assessment_results_revision_id", "result_set_id"];
            isOneToOne: false;
            referencedRelation: "result_sets";
            referencedColumns: ["tenant_id", "assessment_results_revision_id", "id"];
          },
          {
            foreignKeyName: "assessment_findings_tenant_id_assessor_party_id_fkey";
            columns: ["tenant_id", "assessor_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_findings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_objectives: {
        Row: {
          acceptance_criterion: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          plan_revision_id: string;
          requirement_revision_id: string | null;
          revision: number;
          target_control_part_id: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          acceptance_criterion?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          plan_revision_id: string;
          requirement_revision_id?: string | null;
          revision?: number;
          target_control_part_id?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          acceptance_criterion?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          plan_revision_id?: string;
          requirement_revision_id?: string | null;
          revision?: number;
          target_control_part_id?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_objectives_target_control_part_id_fkey";
            columns: ["target_control_part_id"];
            isOneToOne: false;
            referencedRelation: "control_parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_objectives_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_objectives_tenant_id_plan_revision_id_fkey";
            columns: ["tenant_id", "plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_objectives_tenant_id_requirement_revision_id_fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      assessment_plan_revisions: {
        Row: {
          campaign_id: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          oscal_document_revision_id: string | null;
          published_at: string | null;
          published_by_party_id: string | null;
          revision: number;
          ssp_revision_id: string;
          state: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          campaign_id: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          ssp_revision_id: string;
          state?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          campaign_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          ssp_revision_id?: string;
          state?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_plan_revisions_oscal_document_revision_id_fkey";
            columns: ["oscal_document_revision_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_plan_revisions_tenant_id_campaign_id_fkey";
            columns: ["tenant_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "assessment_campaigns";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_plan_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_plan_revisions_tenant_id_published_by_party_id_fkey";
            columns: ["tenant_id", "published_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_plan_revisions_tenant_id_ssp_revision_id_fkey";
            columns: ["tenant_id", "ssp_revision_id"];
            isOneToOne: false;
            referencedRelation: "ssp_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      assessment_results_revisions: {
        Row: {
          assessment_plan_revision_id: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          oscal_document_revision_id: string | null;
          published_at: string | null;
          published_by_party_id: string | null;
          revision: number;
          state: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          assessment_plan_revision_id: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          state?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          assessment_plan_revision_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          state?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_results_revisions_oscal_document_revision_id_fkey";
            columns: ["oscal_document_revision_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_results_revisions_tenant_id_assessment_plan_rev_fkey";
            columns: ["tenant_id", "assessment_plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_results_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_results_revisions_tenant_id_published_by_party__fkey";
            columns: ["tenant_id", "published_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      assessment_subjects: {
        Row: {
          component_id: string | null;
          composition_node_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          inventory_item_id: string | null;
          party_id: string | null;
          plan_revision_id: string;
          revision: number;
          scope_id: string | null;
          system_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          component_id?: string | null;
          composition_node_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          inventory_item_id?: string | null;
          party_id?: string | null;
          plan_revision_id: string;
          revision?: number;
          scope_id?: string | null;
          system_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          component_id?: string | null;
          composition_node_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          inventory_item_id?: string | null;
          party_id?: string | null;
          plan_revision_id?: string;
          revision?: number;
          scope_id?: string | null;
          system_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_subjects_system_element";
            columns: ["tenant_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_subjects_system_element";
            columns: ["tenant_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_subjects_system_element";
            columns: ["tenant_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "assessment_subjects_system_element";
            columns: ["tenant_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_subjects_tenant_id_component_id_fkey";
            columns: ["tenant_id", "component_id"];
            isOneToOne: false;
            referencedRelation: "system_component_element_links";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_subjects_tenant_id_component_id_fkey";
            columns: ["tenant_id", "component_id"];
            isOneToOne: false;
            referencedRelation: "system_components";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_subjects_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_subjects_tenant_id_inventory_item_id_fkey";
            columns: ["tenant_id", "inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_subjects_tenant_id_party_id_fkey";
            columns: ["tenant_id", "party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_subjects_tenant_id_plan_revision_id_fkey";
            columns: ["tenant_id", "plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_subjects_tenant_id_scope_id_fkey";
            columns: ["tenant_id", "scope_id"];
            isOneToOne: false;
            referencedRelation: "scopes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_subjects_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_subjects_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_subjects_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "assessment_subjects_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      assessment_task_dependencies: {
        Row: {
          created_at: string;
          created_by: string | null;
          depends_on_task_id: string;
          id: string;
          plan_revision_id: string;
          revision: number;
          task_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          depends_on_task_id: string;
          id?: string;
          plan_revision_id: string;
          revision?: number;
          task_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          depends_on_task_id?: string;
          id?: string;
          plan_revision_id?: string;
          revision?: number;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_task_dependencies_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_task_dependencies_tenant_id_plan_revision_id_de_fkey";
            columns: ["tenant_id", "plan_revision_id", "depends_on_task_id"];
            isOneToOne: false;
            referencedRelation: "scheduled_assessment_tasks";
            referencedColumns: ["tenant_id", "plan_revision_id", "id"];
          },
          {
            foreignKeyName: "assessment_task_dependencies_tenant_id_plan_revision_id_fkey";
            columns: ["tenant_id", "plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "assessment_task_dependencies_tenant_id_plan_revision_id_ta_fkey";
            columns: ["tenant_id", "plan_revision_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "scheduled_assessment_tasks";
            referencedColumns: ["tenant_id", "plan_revision_id", "id"];
          },
        ];
      };
      authorization_decisions: {
        Row: {
          conditions: string | null;
          created_at: string;
          created_by: string | null;
          decided_at: string;
          decision: string;
          decision_maker_party_id: string;
          effective_on: string | null;
          expires_on: string | null;
          id: string;
          package_revision_id: string;
          rationale: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          conditions?: string | null;
          created_at?: string;
          created_by?: string | null;
          decided_at: string;
          decision: string;
          decision_maker_party_id: string;
          effective_on?: string | null;
          expires_on?: string | null;
          id?: string;
          package_revision_id: string;
          rationale: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          conditions?: string | null;
          created_at?: string;
          created_by?: string | null;
          decided_at?: string;
          decision?: string;
          decision_maker_party_id?: string;
          effective_on?: string | null;
          expires_on?: string | null;
          id?: string;
          package_revision_id?: string;
          rationale?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "authorization_decisions_tenant_id_decision_maker_party_id_fkey";
            columns: ["tenant_id", "decision_maker_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "authorization_decisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authorization_decisions_tenant_id_package_revision_id_fkey";
            columns: ["tenant_id", "package_revision_id"];
            isOneToOne: false;
            referencedRelation: "package_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      authorization_packages: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          owner_party_id: string | null;
          program_id: string;
          revision: number;
          system_id: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id: string;
          revision?: number;
          system_id: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id?: string;
          revision?: number;
          system_id?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "authorization_packages_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "authorization_packages_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "authorization_packages_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "authorization_packages_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "authorization_packages_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "authorization_packages_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "authorization_packages_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      catalog_groups: {
        Row: {
          catalog_revision_id: string;
          class: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          links: Json;
          ordinal: number;
          parent_group_id: string | null;
          props: Json;
          revision: number;
          source_id: string | null;
          source_pointer: string;
          tenant_id: string | null;
          title: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          catalog_revision_id: string;
          class?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          links?: Json;
          ordinal: number;
          parent_group_id?: string | null;
          props?: Json;
          revision?: number;
          source_id?: string | null;
          source_pointer: string;
          tenant_id?: string | null;
          title?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          catalog_revision_id?: string;
          class?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          links?: Json;
          ordinal?: number;
          parent_group_id?: string | null;
          props?: Json;
          revision?: number;
          source_id?: string | null;
          source_pointer?: string;
          tenant_id?: string | null;
          title?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "catalog_groups_catalog_revision_id_fkey";
            columns: ["catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "catalog_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalog_groups_parent_group_id_catalog_revision_id_fkey";
            columns: ["parent_group_id", "catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "catalog_groups";
            referencedColumns: ["id", "catalog_revision_id"];
          },
          {
            foreignKeyName: "catalog_groups_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      catalog_revisions: {
        Row: {
          catalog_id: string;
          created_at: string;
          created_by: string | null;
          document_revision_id: string;
          id: string;
          revision: number;
          state: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
          version: string;
        };
        Insert: {
          catalog_id: string;
          created_at?: string;
          created_by?: string | null;
          document_revision_id: string;
          id?: string;
          revision?: number;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          version: string;
        };
        Update: {
          catalog_id?: string;
          created_at?: string;
          created_by?: string | null;
          document_revision_id?: string;
          id?: string;
          revision?: number;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catalog_revisions_catalog_id_fkey";
            columns: ["catalog_id"];
            isOneToOne: false;
            referencedRelation: "catalogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalog_revisions_document_revision_id_fkey";
            columns: ["document_revision_id"];
            isOneToOne: true;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalog_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      catalogs: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          id: string;
          revision: number;
          source_id: string;
          tenant_id: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          source_id: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          source_id?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "catalogs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "ref_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalogs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      cci_control_links: {
        Row: {
          cci_reference_id: string;
          control_id: string;
          control_part_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          mapping_basis: string;
          revision: number;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          cci_reference_id: string;
          control_id: string;
          control_part_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          mapping_basis: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          cci_reference_id?: string;
          control_id?: string;
          control_part_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          mapping_basis?: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cci_control_links_cci_reference_id_fkey";
            columns: ["cci_reference_id"];
            isOneToOne: false;
            referencedRelation: "cci_references";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cci_control_links_control_id_fkey";
            columns: ["control_id"];
            isOneToOne: false;
            referencedRelation: "controls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cci_control_links_control_part_id_fkey";
            columns: ["control_part_id"];
            isOneToOne: false;
            referencedRelation: "control_parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cci_control_links_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      cci_item_types: {
        Row: {
          cci_item_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          revision: number;
          tenant_id: string | null;
          type: Database["public"]["Enums"]["cci_type"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          cci_item_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          tenant_id?: string | null;
          type: Database["public"]["Enums"]["cci_type"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          cci_item_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          tenant_id?: string | null;
          type?: Database["public"]["Enums"]["cci_type"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cci_item_types_cci_item_id_fkey";
            columns: ["cci_item_id"];
            isOneToOne: false;
            referencedRelation: "cci_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cci_item_types_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      cci_items: {
        Row: {
          cci_revision_id: string;
          code: string;
          contributor: string | null;
          created_at: string;
          created_by: string | null;
          definition: string;
          id: string;
          notes: string[];
          parameters: string[];
          published_on: string;
          revision: number;
          status: Database["public"]["Enums"]["cci_status"];
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          cci_revision_id: string;
          code: string;
          contributor?: string | null;
          created_at?: string;
          created_by?: string | null;
          definition: string;
          id?: string;
          notes?: string[];
          parameters?: string[];
          published_on: string;
          revision?: number;
          status: Database["public"]["Enums"]["cci_status"];
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          cci_revision_id?: string;
          code?: string;
          contributor?: string | null;
          created_at?: string;
          created_by?: string | null;
          definition?: string;
          id?: string;
          notes?: string[];
          parameters?: string[];
          published_on?: string;
          revision?: number;
          status?: Database["public"]["Enums"]["cci_status"];
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cci_items_cci_revision_id_fkey";
            columns: ["cci_revision_id"];
            isOneToOne: false;
            referencedRelation: "cci_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cci_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      cci_references: {
        Row: {
          cci_item_id: string;
          created_at: string;
          created_by: string | null;
          creator: string;
          id: string;
          location: string;
          ordinal: number;
          publication_title: string;
          publication_version: string;
          resolution_status: Database["public"]["Enums"]["reference_resolution_status"];
          revision: number;
          source_index: string;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          cci_item_id: string;
          created_at?: string;
          created_by?: string | null;
          creator: string;
          id?: string;
          location: string;
          ordinal: number;
          publication_title: string;
          publication_version: string;
          resolution_status: Database["public"]["Enums"]["reference_resolution_status"];
          revision?: number;
          source_index: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          cci_item_id?: string;
          created_at?: string;
          created_by?: string | null;
          creator?: string;
          id?: string;
          location?: string;
          ordinal?: number;
          publication_title?: string;
          publication_version?: string;
          resolution_status?: Database["public"]["Enums"]["reference_resolution_status"];
          revision?: number;
          source_index?: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cci_references_cci_item_id_fkey";
            columns: ["cci_item_id"];
            isOneToOne: false;
            referencedRelation: "cci_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cci_references_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      cci_revisions: {
        Row: {
          content_sha256: string;
          created_at: string;
          created_by: string | null;
          id: string;
          original_content: string;
          published_on: string;
          revision: number;
          source_id: string;
          state: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
          version: string;
        };
        Insert: {
          content_sha256: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          original_content: string;
          published_on: string;
          revision?: number;
          source_id: string;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          version: string;
        };
        Update: {
          content_sha256?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          original_content?: string;
          published_on?: string;
          revision?: number;
          source_id?: string;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cci_revisions_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "ref_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cci_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      change_requests: {
        Row: {
          assessment_plan_revision_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          poam_item_revision_id: string | null;
          procedure_revision_id: string | null;
          requested_at: string | null;
          requester_party_id: string | null;
          requirement_revision_id: string | null;
          resolution: string | null;
          resolved_at: string | null;
          reviewer_party_id: string | null;
          revision: number;
          risk_revision_id: string | null;
          ssp_revision_id: string | null;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_plan_revision_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          poam_item_revision_id?: string | null;
          procedure_revision_id?: string | null;
          requested_at?: string | null;
          requester_party_id?: string | null;
          requirement_revision_id?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          reviewer_party_id?: string | null;
          revision?: number;
          risk_revision_id?: string | null;
          ssp_revision_id?: string | null;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_plan_revision_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          poam_item_revision_id?: string | null;
          procedure_revision_id?: string | null;
          requested_at?: string | null;
          requester_party_id?: string | null;
          requirement_revision_id?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          reviewer_party_id?: string | null;
          revision?: number;
          risk_revision_id?: string | null;
          ssp_revision_id?: string | null;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "change_requests_tenant_id_assessment_plan_revision_id_fkey";
            columns: ["tenant_id", "assessment_plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "change_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "change_requests_tenant_id_poam_item_revision_id_fkey";
            columns: ["tenant_id", "poam_item_revision_id"];
            isOneToOne: false;
            referencedRelation: "poam_item_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "change_requests_tenant_id_procedure_revision_id_fkey";
            columns: ["tenant_id", "procedure_revision_id"];
            isOneToOne: false;
            referencedRelation: "procedure_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "change_requests_tenant_id_requester_party_id_fkey";
            columns: ["tenant_id", "requester_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "change_requests_tenant_id_requirement_revision_id_fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "change_requests_tenant_id_reviewer_party_id_fkey";
            columns: ["tenant_id", "reviewer_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "change_requests_tenant_id_risk_revision_id_fkey";
            columns: ["tenant_id", "risk_revision_id"];
            isOneToOne: false;
            referencedRelation: "risk_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "change_requests_tenant_id_ssp_revision_id_fkey";
            columns: ["tenant_id", "ssp_revision_id"];
            isOneToOne: false;
            referencedRelation: "ssp_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      comments: {
        Row: {
          assessment_campaign_id: string | null;
          author_party_id: string;
          body: string;
          created_at: string;
          created_by: string | null;
          evidence_artifact_id: string | null;
          id: string;
          issue_id: string | null;
          package_id: string | null;
          poam_item_id: string | null;
          program_id: string | null;
          revision: number;
          risk_id: string | null;
          task_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_campaign_id?: string | null;
          author_party_id: string;
          body: string;
          created_at?: string;
          created_by?: string | null;
          evidence_artifact_id?: string | null;
          id?: string;
          issue_id?: string | null;
          package_id?: string | null;
          poam_item_id?: string | null;
          program_id?: string | null;
          revision?: number;
          risk_id?: string | null;
          task_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_campaign_id?: string | null;
          author_party_id?: string;
          body?: string;
          created_at?: string;
          created_by?: string | null;
          evidence_artifact_id?: string | null;
          id?: string;
          issue_id?: string | null;
          package_id?: string | null;
          poam_item_id?: string | null;
          program_id?: string | null;
          revision?: number;
          risk_id?: string | null;
          task_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_tenant_id_assessment_campaign_id_fkey";
            columns: ["tenant_id", "assessment_campaign_id"];
            isOneToOne: false;
            referencedRelation: "assessment_campaigns";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "comments_tenant_id_author_party_id_fkey";
            columns: ["tenant_id", "author_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "comments_tenant_id_evidence_artifact_id_fkey";
            columns: ["tenant_id", "evidence_artifact_id"];
            isOneToOne: false;
            referencedRelation: "evidence_artifacts";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "comments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_tenant_id_issue_id_fkey";
            columns: ["tenant_id", "issue_id"];
            isOneToOne: false;
            referencedRelation: "operational_issues";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "comments_tenant_id_package_id_fkey";
            columns: ["tenant_id", "package_id"];
            isOneToOne: false;
            referencedRelation: "authorization_packages";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "comments_tenant_id_poam_item_id_fkey";
            columns: ["tenant_id", "poam_item_id"];
            isOneToOne: false;
            referencedRelation: "poam_items";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "comments_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "comments_tenant_id_risk_id_fkey";
            columns: ["tenant_id", "risk_id"];
            isOneToOne: false;
            referencedRelation: "risks";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "comments_tenant_id_task_id_fkey";
            columns: ["tenant_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      component_contributions: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string;
          id: string;
          implementation_statement_id: string | null;
          implementation_status: string;
          implemented_requirement_id: string;
          library_implementation_id: string | null;
          responsible_party_id: string | null;
          revision: number;
          ssp_revision_id: string;
          system_component_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description: string;
          id?: string;
          implementation_statement_id?: string | null;
          implementation_status?: string;
          implemented_requirement_id: string;
          library_implementation_id?: string | null;
          responsible_party_id?: string | null;
          revision?: number;
          ssp_revision_id: string;
          system_component_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          implementation_statement_id?: string | null;
          implementation_status?: string;
          implemented_requirement_id?: string;
          library_implementation_id?: string | null;
          responsible_party_id?: string | null;
          revision?: number;
          ssp_revision_id?: string;
          system_component_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "component_contribution_library";
            columns: ["tenant_id", "library_implementation_id"];
            isOneToOne: false;
            referencedRelation: "defined_component_implementations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "component_contributions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "component_contributions_tenant_id_implemented_requirement__fkey";
            columns: ["tenant_id", "implemented_requirement_id", "implementation_statement_id"];
            isOneToOne: false;
            referencedRelation: "implementation_statements";
            referencedColumns: ["tenant_id", "implemented_requirement_id", "id"];
          },
          {
            foreignKeyName: "component_contributions_tenant_id_responsible_party_id_fkey";
            columns: ["tenant_id", "responsible_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "component_contributions_tenant_id_ssp_revision_id_implemen_fkey";
            columns: ["tenant_id", "ssp_revision_id", "implemented_requirement_id"];
            isOneToOne: false;
            referencedRelation: "implemented_requirements";
            referencedColumns: ["tenant_id", "ssp_revision_id", "id"];
          },
          {
            foreignKeyName: "component_contributions_tenant_id_system_component_id_fkey";
            columns: ["tenant_id", "system_component_id"];
            isOneToOne: false;
            referencedRelation: "system_component_element_links";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "component_contributions_tenant_id_system_component_id_fkey";
            columns: ["tenant_id", "system_component_id"];
            isOneToOne: false;
            referencedRelation: "system_components";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      component_definition_revisions: {
        Row: {
          component_definition_id: string;
          conditions: string | null;
          consumer_responsibilities: string | null;
          created_at: string;
          created_by: string | null;
          effective_from: string | null;
          id: string;
          oscal_document_revision_id: string | null;
          oscal_uuid: string | null;
          published_at: string | null;
          remarks: string | null;
          review_due: string | null;
          revision: number;
          state: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          component_definition_id: string;
          conditions?: string | null;
          consumer_responsibilities?: string | null;
          created_at?: string;
          created_by?: string | null;
          effective_from?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          oscal_uuid?: string | null;
          published_at?: string | null;
          remarks?: string | null;
          review_due?: string | null;
          revision?: number;
          state?: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          component_definition_id?: string;
          conditions?: string | null;
          consumer_responsibilities?: string | null;
          created_at?: string;
          created_by?: string | null;
          effective_from?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          oscal_uuid?: string | null;
          published_at?: string | null;
          remarks?: string | null;
          review_due?: string | null;
          revision?: number;
          state?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "component_definition_revision_tenant_id_component_definiti_fkey";
            columns: ["tenant_id", "component_definition_id"];
            isOneToOne: false;
            referencedRelation: "component_definitions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "component_definition_revisions_oscal_document_revision_id_fkey";
            columns: ["oscal_document_revision_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "component_definition_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      component_definitions: {
        Row: {
          category: string;
          code: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          category?: string;
          code: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          category?: string;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "component_definitions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      component_pins: {
        Row: {
          configuration_baseline_id: string;
          configuration_description: string | null;
          content_sha256: string | null;
          created_at: string;
          created_by: string | null;
          defined_component_id: string | null;
          id: string;
          revision: number;
          system_component_id: string;
          system_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version: string | null;
        };
        Insert: {
          configuration_baseline_id: string;
          configuration_description?: string | null;
          content_sha256?: string | null;
          created_at?: string;
          created_by?: string | null;
          defined_component_id?: string | null;
          id?: string;
          revision?: number;
          system_component_id: string;
          system_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: string | null;
        };
        Update: {
          configuration_baseline_id?: string;
          configuration_description?: string | null;
          content_sha256?: string | null;
          created_at?: string;
          created_by?: string | null;
          defined_component_id?: string | null;
          id?: string;
          revision?: number;
          system_component_id?: string;
          system_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "component_pins_tenant_id_defined_component_id_fkey";
            columns: ["tenant_id", "defined_component_id"];
            isOneToOne: false;
            referencedRelation: "defined_components";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "component_pins_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "component_pins_tenant_id_system_id_configuration_baseline__fkey";
            columns: ["tenant_id", "system_id", "configuration_baseline_id"];
            isOneToOne: false;
            referencedRelation: "configuration_baselines";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
          {
            foreignKeyName: "component_pins_tenant_id_system_id_system_component_id_fkey";
            columns: ["tenant_id", "system_id", "system_component_id"];
            isOneToOne: false;
            referencedRelation: "system_component_element_links";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
          {
            foreignKeyName: "component_pins_tenant_id_system_id_system_component_id_fkey";
            columns: ["tenant_id", "system_id", "system_component_id"];
            isOneToOne: false;
            referencedRelation: "system_components";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
        ];
      };
      component_relationships: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          port: number | null;
          protocol: string | null;
          relationship_type: string;
          revision: number;
          source_node_id: string;
          system_id: string;
          target_node_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          port?: number | null;
          protocol?: string | null;
          relationship_type: string;
          revision?: number;
          source_node_id: string;
          system_id: string;
          target_node_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          port?: number | null;
          protocol?: string | null;
          relationship_type?: string;
          revision?: number;
          source_node_id?: string;
          system_id?: string;
          target_node_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "component_relationships_source_system";
            columns: ["tenant_id", "system_id", "source_node_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
          {
            foreignKeyName: "component_relationships_source_system";
            columns: ["tenant_id", "system_id", "source_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "boundary_system_id", "id"];
          },
          {
            foreignKeyName: "component_relationships_source_system";
            columns: ["tenant_id", "system_id", "source_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "boundary_system_id", "system_id"];
          },
          {
            foreignKeyName: "component_relationships_source_system";
            columns: ["tenant_id", "system_id", "source_node_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "boundary_system_id", "id"];
          },
          {
            foreignKeyName: "component_relationships_target_system";
            columns: ["tenant_id", "system_id", "target_node_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
          {
            foreignKeyName: "component_relationships_target_system";
            columns: ["tenant_id", "system_id", "target_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "boundary_system_id", "id"];
          },
          {
            foreignKeyName: "component_relationships_target_system";
            columns: ["tenant_id", "system_id", "target_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "boundary_system_id", "system_id"];
          },
          {
            foreignKeyName: "component_relationships_target_system";
            columns: ["tenant_id", "system_id", "target_node_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "boundary_system_id", "id"];
          },
          {
            foreignKeyName: "component_relationships_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "component_relationships_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "component_relationships_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "component_relationships_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "component_relationships_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      composition_nodes_archive_20260913: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          node_type: string;
          parent_id: string | null;
          revision: number;
          system_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          node_type: string;
          parent_id?: string | null;
          revision?: number;
          system_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          node_type?: string;
          parent_id?: string | null;
          revision?: number;
          system_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      configuration_baselines: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          published_at: string | null;
          revision: number;
          state: string;
          system_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          published_at?: string | null;
          revision?: number;
          state?: string;
          system_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          published_at?: string | null;
          revision?: number;
          state?: string;
          system_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "configuration_baselines_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "configuration_baselines_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "configuration_baselines_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "configuration_baselines_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "configuration_baselines_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      control_links: {
        Row: {
          control_id: string;
          created_at: string;
          created_by: string | null;
          href: string;
          id: string;
          media_type: string | null;
          ordinal: number;
          relation: string | null;
          resource_id: string | null;
          revision: number;
          target_control_id: string | null;
          target_group_id: string | null;
          target_part_id: string | null;
          tenant_id: string | null;
          text: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          control_id: string;
          created_at?: string;
          created_by?: string | null;
          href: string;
          id?: string;
          media_type?: string | null;
          ordinal: number;
          relation?: string | null;
          resource_id?: string | null;
          revision?: number;
          target_control_id?: string | null;
          target_group_id?: string | null;
          target_part_id?: string | null;
          tenant_id?: string | null;
          text?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          control_id?: string;
          created_at?: string;
          created_by?: string | null;
          href?: string;
          id?: string;
          media_type?: string | null;
          ordinal?: number;
          relation?: string | null;
          resource_id?: string | null;
          revision?: number;
          target_control_id?: string | null;
          target_group_id?: string | null;
          target_part_id?: string | null;
          tenant_id?: string | null;
          text?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "control_links_control_id_fkey";
            columns: ["control_id"];
            isOneToOne: false;
            referencedRelation: "controls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "control_links_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_resources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "control_links_target_control_id_fkey";
            columns: ["target_control_id"];
            isOneToOne: false;
            referencedRelation: "controls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "control_links_target_group_id_fkey";
            columns: ["target_group_id"];
            isOneToOne: false;
            referencedRelation: "catalog_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "control_links_target_part_id_fkey";
            columns: ["target_part_id"];
            isOneToOne: false;
            referencedRelation: "control_parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "control_links_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      control_mappings: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          mapping_collection_id: string;
          rationale: string | null;
          relationship: Database["public"]["Enums"]["mapping_relationship"];
          revision: number;
          source_identifier: string | null;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          mapping_collection_id: string;
          rationale?: string | null;
          relationship: Database["public"]["Enums"]["mapping_relationship"];
          revision?: number;
          source_identifier?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          mapping_collection_id?: string;
          rationale?: string | null;
          relationship?: Database["public"]["Enums"]["mapping_relationship"];
          revision?: number;
          source_identifier?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "control_mappings_mapping_collection_id_fkey";
            columns: ["mapping_collection_id"];
            isOneToOne: false;
            referencedRelation: "mapping_collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "control_mappings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      control_parts: {
        Row: {
          catalog_revision_id: string;
          class: string | null;
          control_id: string | null;
          created_at: string;
          created_by: string | null;
          group_id: string | null;
          id: string;
          links: Json;
          name: string;
          namespace: string | null;
          ordinal: number;
          parent_part_id: string | null;
          props: Json;
          prose: string | null;
          revision: number;
          source_id: string | null;
          source_pointer: string;
          tenant_id: string | null;
          title: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          catalog_revision_id: string;
          class?: string | null;
          control_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          group_id?: string | null;
          id?: string;
          links?: Json;
          name: string;
          namespace?: string | null;
          ordinal: number;
          parent_part_id?: string | null;
          props?: Json;
          prose?: string | null;
          revision?: number;
          source_id?: string | null;
          source_pointer: string;
          tenant_id?: string | null;
          title?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          catalog_revision_id?: string;
          class?: string | null;
          control_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          group_id?: string | null;
          id?: string;
          links?: Json;
          name?: string;
          namespace?: string | null;
          ordinal?: number;
          parent_part_id?: string | null;
          props?: Json;
          prose?: string | null;
          revision?: number;
          source_id?: string | null;
          source_pointer?: string;
          tenant_id?: string | null;
          title?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "control_parts_catalog_revision_id_fkey";
            columns: ["catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "catalog_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "control_parts_control_id_catalog_revision_id_fkey";
            columns: ["control_id", "catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "controls";
            referencedColumns: ["id", "catalog_revision_id"];
          },
          {
            foreignKeyName: "control_parts_group_id_catalog_revision_id_fkey";
            columns: ["group_id", "catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "catalog_groups";
            referencedColumns: ["id", "catalog_revision_id"];
          },
          {
            foreignKeyName: "control_parts_parent_part_id_catalog_revision_id_fkey";
            columns: ["parent_part_id", "catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "control_parts";
            referencedColumns: ["id", "catalog_revision_id"];
          },
          {
            foreignKeyName: "control_parts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      controls: {
        Row: {
          catalog_revision_id: string;
          class: string | null;
          code: string;
          created_at: string;
          created_by: string | null;
          group_id: string | null;
          id: string;
          ordinal: number;
          parent_control_id: string | null;
          props: Json;
          revision: number;
          source_id: string;
          status: Database["public"]["Enums"]["control_publication_status"];
          tenant_id: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          catalog_revision_id: string;
          class?: string | null;
          code: string;
          created_at?: string;
          created_by?: string | null;
          group_id?: string | null;
          id?: string;
          ordinal: number;
          parent_control_id?: string | null;
          props?: Json;
          revision?: number;
          source_id: string;
          status?: Database["public"]["Enums"]["control_publication_status"];
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          catalog_revision_id?: string;
          class?: string | null;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          group_id?: string | null;
          id?: string;
          ordinal?: number;
          parent_control_id?: string | null;
          props?: Json;
          revision?: number;
          source_id?: string;
          status?: Database["public"]["Enums"]["control_publication_status"];
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "controls_catalog_revision_id_fkey";
            columns: ["catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "catalog_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "controls_group_id_catalog_revision_id_fkey";
            columns: ["group_id", "catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "catalog_groups";
            referencedColumns: ["id", "catalog_revision_id"];
          },
          {
            foreignKeyName: "controls_parent_control_id_catalog_revision_id_fkey";
            columns: ["parent_control_id", "catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "controls";
            referencedColumns: ["id", "catalog_revision_id"];
          },
          {
            foreignKeyName: "controls_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      defined_component_evidence: {
        Row: {
          claim: string | null;
          component_definition_revision_id: string;
          created_at: string;
          created_by: string | null;
          evidence_version_id: string;
          id: string;
          implementation_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          claim?: string | null;
          component_definition_revision_id: string;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id: string;
          id?: string;
          implementation_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          claim?: string | null;
          component_definition_revision_id?: string;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id?: string;
          id?: string;
          implementation_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "defined_component_evidence_tenant_id_component_definition__fkey";
            columns: ["tenant_id", "component_definition_revision_id"];
            isOneToOne: false;
            referencedRelation: "component_definition_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "defined_component_evidence_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "defined_component_evidence_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "defined_component_evidence_tenant_id_implementation_id_fkey";
            columns: ["tenant_id", "implementation_id"];
            isOneToOne: false;
            referencedRelation: "defined_component_implementations";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      defined_component_implementations: {
        Row: {
          component_definition_revision_id: string;
          consumer_responsibility: string | null;
          control_id: string | null;
          control_part_id: string | null;
          coverage: string;
          coverage_rationale: string | null;
          created_at: string;
          created_by: string | null;
          defined_component_id: string;
          description: string;
          id: string;
          implementation_status: string;
          requirement_definition_revision_id: string | null;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          component_definition_revision_id: string;
          consumer_responsibility?: string | null;
          control_id?: string | null;
          control_part_id?: string | null;
          coverage?: string;
          coverage_rationale?: string | null;
          created_at?: string;
          created_by?: string | null;
          defined_component_id: string;
          description: string;
          id?: string;
          implementation_status: string;
          requirement_definition_revision_id?: string | null;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          component_definition_revision_id?: string;
          consumer_responsibility?: string | null;
          control_id?: string | null;
          control_part_id?: string | null;
          coverage?: string;
          coverage_rationale?: string | null;
          created_at?: string;
          created_by?: string | null;
          defined_component_id?: string;
          description?: string;
          id?: string;
          implementation_status?: string;
          requirement_definition_revision_id?: string | null;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "defined_component_implementat_tenant_id_component_definiti_fkey";
            columns: ["tenant_id", "component_definition_revision_id", "defined_component_id"];
            isOneToOne: false;
            referencedRelation: "defined_components";
            referencedColumns: ["tenant_id", "component_definition_revision_id", "id"];
          },
          {
            foreignKeyName: "defined_component_implementation_requirement";
            columns: ["tenant_id", "requirement_definition_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_definition_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "defined_component_implementations_control_id_fkey";
            columns: ["control_id"];
            isOneToOne: false;
            referencedRelation: "controls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "defined_component_implementations_control_part_id_fkey";
            columns: ["control_part_id"];
            isOneToOne: false;
            referencedRelation: "control_parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "defined_component_implementations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      defined_components: {
        Row: {
          component_definition_revision_id: string;
          component_type: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          oscal_uuid: string | null;
          revision: number;
          supplier_party_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          component_definition_revision_id: string;
          component_type: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          oscal_uuid?: string | null;
          revision?: number;
          supplier_party_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          component_definition_revision_id?: string;
          component_type?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          oscal_uuid?: string | null;
          revision?: number;
          supplier_party_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "defined_components_tenant_id_component_definition_revision_fkey";
            columns: ["tenant_id", "component_definition_revision_id"];
            isOneToOne: false;
            referencedRelation: "component_definition_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "defined_components_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "defined_components_tenant_id_supplier_party_id_fkey";
            columns: ["tenant_id", "supplier_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      demo_import_batches: {
        Row: {
          dataset_id: string;
          fixture_sha256: string;
          id: string;
          imported_at: string;
          ingestion_job_id: string;
          source_manifest: Json;
          summary: Json;
          tenant_id: string;
        };
        Insert: {
          dataset_id: string;
          fixture_sha256: string;
          id: string;
          imported_at: string;
          ingestion_job_id: string;
          source_manifest: Json;
          summary: Json;
          tenant_id: string;
        };
        Update: {
          dataset_id?: string;
          fixture_sha256?: string;
          id?: string;
          imported_at?: string;
          ingestion_job_id?: string;
          source_manifest?: Json;
          summary?: Json;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "demo_import_batches_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "demo_import_batches_tenant_id_ingestion_job_id_fkey";
            columns: ["tenant_id", "ingestion_job_id"];
            isOneToOne: false;
            referencedRelation: "ingestion_jobs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      demo_import_records: {
        Row: {
          dataset_id: string;
          destination_id: string;
          destination_table: string;
          id: string;
          import_batch_id: string;
          mapped_values: Json;
          source_key: string;
          source_pointer: string | null;
          source_record_id: string;
          source_sha256: string;
          tenant_id: string;
        };
        Insert: {
          dataset_id: string;
          destination_id: string;
          destination_table: string;
          id: string;
          import_batch_id: string;
          mapped_values: Json;
          source_key: string;
          source_pointer?: string | null;
          source_record_id: string;
          source_sha256: string;
          tenant_id: string;
        };
        Update: {
          dataset_id?: string;
          destination_id?: string;
          destination_table?: string;
          id?: string;
          import_batch_id?: string;
          mapped_values?: Json;
          source_key?: string;
          source_pointer?: string | null;
          source_record_id?: string;
          source_sha256?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "demo_import_records_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "demo_import_records_tenant_id_import_batch_id_fkey";
            columns: ["tenant_id", "import_batch_id"];
            isOneToOne: false;
            referencedRelation: "demo_import_batches";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "demo_import_records_tenant_id_source_record_id_fkey";
            columns: ["tenant_id", "source_record_id"];
            isOneToOne: false;
            referencedRelation: "demo_import_sources";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      demo_import_sources: {
        Row: {
          id: string;
          import_batch_id: string;
          source_pointer: string;
          source_record: Json | null;
          source_sha256: string;
          tenant_id: string;
        };
        Insert: {
          id: string;
          import_batch_id: string;
          source_pointer: string;
          source_record?: Json | null;
          source_sha256: string;
          tenant_id: string;
        };
        Update: {
          id?: string;
          import_batch_id?: string;
          source_pointer?: string;
          source_record?: Json | null;
          source_sha256?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "demo_import_sources_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "demo_import_sources_tenant_id_import_batch_id_fkey";
            columns: ["tenant_id", "import_batch_id"];
            isOneToOne: false;
            referencedRelation: "demo_import_batches";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      engineering_requirements: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          definition_revision_id: string | null;
          id: string;
          program_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          definition_revision_id?: string | null;
          id?: string;
          program_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          definition_revision_id?: string | null;
          id?: string;
          program_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "engineering_requirement_definition";
            columns: ["tenant_id", "definition_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_definition_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "engineering_requirements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "engineering_requirements_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      evidence_artifacts: {
        Row: {
          artifact_kind: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          owner_party_id: string | null;
          program_id: string | null;
          retention_until: string | null;
          revision: number;
          scope_id: string | null;
          source_uri: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          artifact_kind: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id?: string | null;
          retention_until?: string | null;
          revision?: number;
          scope_id?: string | null;
          source_uri?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          artifact_kind?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id?: string | null;
          retention_until?: string | null;
          revision?: number;
          scope_id?: string | null;
          source_uri?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_artifacts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_artifacts_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_artifacts_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_artifacts_tenant_id_scope_id_fkey";
            columns: ["tenant_id", "scope_id"];
            isOneToOne: false;
            referencedRelation: "scopes";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      evidence_create_requests: {
        Row: {
          artifact_id: string | null;
          created_at: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          tenant_id: string;
          version_id: string | null;
        };
        Insert: {
          artifact_id?: string | null;
          created_at?: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          tenant_id: string;
          version_id?: string | null;
        };
        Update: {
          artifact_id?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          payload_sha256?: string;
          tenant_id?: string;
          version_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_create_requests_tenant_id_artifact_id_fkey";
            columns: ["tenant_id", "artifact_id"];
            isOneToOne: true;
            referencedRelation: "evidence_artifacts";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_create_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_create_requests_tenant_id_version_id_fkey";
            columns: ["tenant_id", "version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      evidence_reviews: {
        Row: {
          created_at: string;
          created_by: string | null;
          decision: string;
          evidence_version_id: string;
          id: string;
          rationale: string | null;
          reviewed_at: string | null;
          reviewer_party_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          decision: string;
          evidence_version_id: string;
          id?: string;
          rationale?: string | null;
          reviewed_at?: string | null;
          reviewer_party_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          decision?: string;
          evidence_version_id?: string;
          id?: string;
          rationale?: string | null;
          reviewed_at?: string | null;
          reviewer_party_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_reviews_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_reviews_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_reviews_tenant_id_reviewer_party_id_fkey";
            columns: ["tenant_id", "reviewer_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      evidence_uses: {
        Row: {
          assignment_id: string | null;
          claim: string | null;
          component_contribution_id: string | null;
          created_at: string;
          created_by: string | null;
          decided_at: string | null;
          decided_by: string | null;
          decision: string;
          evidence_version_id: string;
          id: string;
          program_id: string;
          rationale: string | null;
          requirement_revision_id: string | null;
          revision: number;
          system_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assignment_id?: string | null;
          claim?: string | null;
          component_contribution_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          decision?: string;
          evidence_version_id: string;
          id?: string;
          program_id: string;
          rationale?: string | null;
          requirement_revision_id?: string | null;
          revision?: number;
          system_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assignment_id?: string | null;
          claim?: string | null;
          component_contribution_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          decision?: string;
          evidence_version_id?: string;
          id?: string;
          program_id?: string;
          rationale?: string | null;
          requirement_revision_id?: string | null;
          revision?: number;
          system_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_uses_tenant_id_assignment_id_fkey";
            columns: ["tenant_id", "assignment_id"];
            isOneToOne: false;
            referencedRelation: "library_assignments";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_uses_tenant_id_component_contribution_id_fkey";
            columns: ["tenant_id", "component_contribution_id"];
            isOneToOne: false;
            referencedRelation: "component_contributions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_uses_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_uses_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_uses_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_uses_tenant_id_requirement_revision_id_fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_uses_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_uses_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_uses_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "evidence_uses_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      evidence_versions: {
        Row: {
          artifact_id: string;
          byte_size: number | null;
          collected_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          expires_at: string | null;
          external_uri: string | null;
          id: string;
          media_type: string | null;
          provenance: string | null;
          published_at: string | null;
          published_by_party_id: string | null;
          revision: number;
          sha256: string | null;
          state: string;
          storage_object_id: string | null;
          storage_object_name: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          artifact_id: string;
          byte_size?: number | null;
          collected_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          external_uri?: string | null;
          id?: string;
          media_type?: string | null;
          provenance?: string | null;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          sha256?: string | null;
          state?: string;
          storage_object_id?: string | null;
          storage_object_name?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          artifact_id?: string;
          byte_size?: number | null;
          collected_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          external_uri?: string | null;
          id?: string;
          media_type?: string | null;
          provenance?: string | null;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          sha256?: string | null;
          state?: string;
          storage_object_id?: string | null;
          storage_object_name?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_versions_tenant_id_artifact_id_fkey";
            columns: ["tenant_id", "artifact_id"];
            isOneToOne: false;
            referencedRelation: "evidence_artifacts";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "evidence_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evidence_versions_tenant_id_published_by_party_id_fkey";
            columns: ["tenant_id", "published_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      finding_evidence: {
        Row: {
          applicability_rationale: string | null;
          claim: string | null;
          created_at: string;
          created_by: string | null;
          evidence_version_id: string;
          finding_id: string;
          id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id: string;
          finding_id: string;
          id?: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id?: string;
          finding_id?: string;
          id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "finding_evidence_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "finding_evidence_tenant_id_finding_id_fkey";
            columns: ["tenant_id", "finding_id"];
            isOneToOne: false;
            referencedRelation: "assessment_findings";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "finding_evidence_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      finding_observations: {
        Row: {
          assessment_results_revision_id: string;
          created_at: string;
          created_by: string | null;
          finding_id: string;
          id: string;
          observation_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_results_revision_id: string;
          created_at?: string;
          created_by?: string | null;
          finding_id: string;
          id?: string;
          observation_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_results_revision_id?: string;
          created_at?: string;
          created_by?: string | null;
          finding_id?: string;
          id?: string;
          observation_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "finding_observations_tenant_id_assessment_results_revisio_fkey1";
            columns: ["tenant_id", "assessment_results_revision_id", "finding_id"];
            isOneToOne: false;
            referencedRelation: "assessment_findings";
            referencedColumns: ["tenant_id", "assessment_results_revision_id", "id"];
          },
          {
            foreignKeyName: "finding_observations_tenant_id_assessment_results_revision_fkey";
            columns: ["tenant_id", "assessment_results_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_results_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "finding_observations_tenant_id_finding_id_fkey";
            columns: ["tenant_id", "finding_id"];
            isOneToOne: false;
            referencedRelation: "assessment_findings";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "finding_observations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "finding_observations_tenant_id_observation_id_fkey";
            columns: ["tenant_id", "observation_id"];
            isOneToOne: false;
            referencedRelation: "observations";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      finding_risks: {
        Row: {
          assessment_results_revision_id: string;
          created_at: string;
          created_by: string | null;
          finding_id: string;
          id: string;
          revision: number;
          risk_revision_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_results_revision_id: string;
          created_at?: string;
          created_by?: string | null;
          finding_id: string;
          id?: string;
          revision?: number;
          risk_revision_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_results_revision_id?: string;
          created_at?: string;
          created_by?: string | null;
          finding_id?: string;
          id?: string;
          revision?: number;
          risk_revision_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "finding_risks_tenant_id_assessment_results_revision_id_fin_fkey";
            columns: ["tenant_id", "assessment_results_revision_id", "finding_id"];
            isOneToOne: false;
            referencedRelation: "assessment_findings";
            referencedColumns: ["tenant_id", "assessment_results_revision_id", "id"];
          },
          {
            foreignKeyName: "finding_risks_tenant_id_assessment_results_revision_id_fkey";
            columns: ["tenant_id", "assessment_results_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_results_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "finding_risks_tenant_id_finding_id_fkey";
            columns: ["tenant_id", "finding_id"];
            isOneToOne: false;
            referencedRelation: "assessment_findings";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "finding_risks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "finding_risks_tenant_id_risk_revision_id_fkey";
            columns: ["tenant_id", "risk_revision_id"];
            isOneToOne: false;
            referencedRelation: "risk_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      gate_criteria: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          gate_id: string;
          id: string;
          required: boolean;
          revision: number;
          sequence_number: number | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          gate_id: string;
          id?: string;
          required?: boolean;
          revision?: number;
          sequence_number?: number | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          gate_id?: string;
          id?: string;
          required?: boolean;
          revision?: number;
          sequence_number?: number | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gate_criteria_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gate_criteria_tenant_id_gate_id_fkey";
            columns: ["tenant_id", "gate_id"];
            isOneToOne: false;
            referencedRelation: "lifecycle_gates";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      gate_evidence: {
        Row: {
          applicability_rationale: string | null;
          claim: string | null;
          created_at: string;
          created_by: string | null;
          evidence_version_id: string;
          gate_criterion_id: string;
          id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id: string;
          gate_criterion_id: string;
          id?: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id?: string;
          gate_criterion_id?: string;
          id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gate_evidence_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "gate_evidence_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gate_evidence_tenant_id_gate_criterion_id_fkey";
            columns: ["tenant_id", "gate_criterion_id"];
            isOneToOne: false;
            referencedRelation: "gate_criteria";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      implementation_evidence: {
        Row: {
          applicability_rationale: string | null;
          claim: string | null;
          component_contribution_id: string | null;
          created_at: string;
          created_by: string | null;
          evidence_version_id: string;
          id: string;
          implementation_statement_id: string | null;
          implemented_requirement_id: string | null;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          applicability_rationale?: string | null;
          claim?: string | null;
          component_contribution_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id: string;
          id?: string;
          implementation_statement_id?: string | null;
          implemented_requirement_id?: string | null;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          applicability_rationale?: string | null;
          claim?: string | null;
          component_contribution_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id?: string;
          id?: string;
          implementation_statement_id?: string | null;
          implemented_requirement_id?: string | null;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "implementation_evidence_component";
            columns: ["tenant_id", "component_contribution_id"];
            isOneToOne: false;
            referencedRelation: "component_contributions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "implementation_evidence_control";
            columns: ["tenant_id", "implemented_requirement_id"];
            isOneToOne: false;
            referencedRelation: "implemented_requirements";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "implementation_evidence_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "implementation_evidence_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "implementation_evidence_tenant_id_implementation_statement_fkey";
            columns: ["tenant_id", "implementation_statement_id"];
            isOneToOne: false;
            referencedRelation: "implementation_statements";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      implementation_statements: {
        Row: {
          control_part_id: string;
          created_at: string;
          created_by: string | null;
          description: string;
          id: string;
          implemented_requirement_id: string;
          revision: number;
          ssp_revision_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          control_part_id: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          id?: string;
          implemented_requirement_id: string;
          revision?: number;
          ssp_revision_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          control_part_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          implemented_requirement_id?: string;
          revision?: number;
          ssp_revision_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "implementation_statements_control_part_id_fkey";
            columns: ["control_part_id"];
            isOneToOne: false;
            referencedRelation: "control_parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "implementation_statements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "implementation_statements_tenant_id_ssp_revision_id_implem_fkey";
            columns: ["tenant_id", "ssp_revision_id", "implemented_requirement_id"];
            isOneToOne: false;
            referencedRelation: "implemented_requirements";
            referencedColumns: ["tenant_id", "ssp_revision_id", "id"];
          },
        ];
      };
      implemented_requirements: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          implementation_status: string;
          not_applicable_rationale: string | null;
          responsible_party_id: string | null;
          revision: number;
          selected_control_id: string;
          ssp_revision_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          implementation_status?: string;
          not_applicable_rationale?: string | null;
          responsible_party_id?: string | null;
          revision?: number;
          selected_control_id: string;
          ssp_revision_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          implementation_status?: string;
          not_applicable_rationale?: string | null;
          responsible_party_id?: string | null;
          revision?: number;
          selected_control_id?: string;
          ssp_revision_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "implemented_requirements_selected_control_id_fkey";
            columns: ["selected_control_id"];
            isOneToOne: false;
            referencedRelation: "selected_controls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "implemented_requirements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "implemented_requirements_tenant_id_responsible_party_id_fkey";
            columns: ["tenant_id", "responsible_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "implemented_requirements_tenant_id_ssp_revision_id_fkey";
            columns: ["tenant_id", "ssp_revision_id"];
            isOneToOne: false;
            referencedRelation: "ssp_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      import_issues: {
        Row: {
          code: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          ingestion_job_id: string;
          message: string;
          resolution: string | null;
          resolved_at: string | null;
          revision: number;
          severity: string;
          source_pointer: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ingestion_job_id: string;
          message: string;
          resolution?: string | null;
          resolved_at?: string | null;
          revision?: number;
          severity: string;
          source_pointer?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ingestion_job_id?: string;
          message?: string;
          resolution?: string | null;
          resolved_at?: string | null;
          revision?: number;
          severity?: string;
          source_pointer?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "import_issues_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "import_issues_tenant_id_ingestion_job_id_fkey";
            columns: ["tenant_id", "ingestion_job_id"];
            isOneToOne: false;
            referencedRelation: "ingestion_jobs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      ingestion_jobs: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          oscal_document_revision_id: string | null;
          program_id: string | null;
          requested_by_party_id: string | null;
          revision: number;
          source_media_type: string | null;
          source_sha256: string | null;
          source_uri: string | null;
          started_at: string | null;
          status: string;
          summary: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          program_id?: string | null;
          requested_by_party_id?: string | null;
          revision?: number;
          source_media_type?: string | null;
          source_sha256?: string | null;
          source_uri?: string | null;
          started_at?: string | null;
          status?: string;
          summary?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          program_id?: string | null;
          requested_by_party_id?: string | null;
          revision?: number;
          source_media_type?: string | null;
          source_sha256?: string | null;
          source_uri?: string | null;
          started_at?: string | null;
          status?: string;
          summary?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_oscal_document_revision_id_fkey";
            columns: ["oscal_document_revision_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_jobs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ingestion_jobs_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "ingestion_jobs_tenant_id_requested_by_party_id_fkey";
            columns: ["tenant_id", "requested_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      inheritance_acceptances: {
        Row: {
          accepted_at: string;
          accepted_by_party_id: string;
          consumer_responsibility: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          implemented_requirement_id: string;
          offered_implementation_id: string;
          rationale: string;
          revision: number;
          ssp_revision_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          accepted_at: string;
          accepted_by_party_id: string;
          consumer_responsibility?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          implemented_requirement_id: string;
          offered_implementation_id: string;
          rationale: string;
          revision?: number;
          ssp_revision_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          accepted_at?: string;
          accepted_by_party_id?: string;
          consumer_responsibility?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          implemented_requirement_id?: string;
          offered_implementation_id?: string;
          rationale?: string;
          revision?: number;
          ssp_revision_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inheritance_acceptances_tenant_id_accepted_by_party_id_fkey";
            columns: ["tenant_id", "accepted_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "inheritance_acceptances_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inheritance_acceptances_tenant_id_offered_implementation_i_fkey";
            columns: ["tenant_id", "offered_implementation_id"];
            isOneToOne: false;
            referencedRelation: "offered_implementations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "inheritance_acceptances_tenant_id_ssp_revision_id_implemen_fkey";
            columns: ["tenant_id", "ssp_revision_id", "implemented_requirement_id"];
            isOneToOne: false;
            referencedRelation: "implemented_requirements";
            referencedColumns: ["tenant_id", "ssp_revision_id", "id"];
          },
        ];
      };
      inventory_components: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          inventory_item_id: string;
          revision: number;
          system_component_id: string;
          system_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          inventory_item_id: string;
          revision?: number;
          system_component_id: string;
          system_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          inventory_item_id?: string;
          revision?: number;
          system_component_id?: string;
          system_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_components_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "inventory_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "inventory_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "inventory_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "inventory_components_tenant_id_system_id_inventory_item_id_fkey";
            columns: ["tenant_id", "system_id", "inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
          {
            foreignKeyName: "inventory_components_tenant_id_system_id_system_component__fkey";
            columns: ["tenant_id", "system_id", "system_component_id"];
            isOneToOne: false;
            referencedRelation: "system_component_element_links";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
          {
            foreignKeyName: "inventory_components_tenant_id_system_id_system_component__fkey";
            columns: ["tenant_id", "system_id", "system_component_id"];
            isOneToOne: false;
            referencedRelation: "system_components";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
        ];
      };
      inventory_items: {
        Row: {
          asset_id: string;
          asset_owner_party_id: string | null;
          composition_node_id: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          installed_on: string | null;
          manufacturer: string | null;
          model: string | null;
          name: string;
          retired_on: string | null;
          revision: number;
          serial_number: string | null;
          system_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          asset_id: string;
          asset_owner_party_id?: string | null;
          composition_node_id: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          installed_on?: string | null;
          manufacturer?: string | null;
          model?: string | null;
          name: string;
          retired_on?: string | null;
          revision?: number;
          serial_number?: string | null;
          system_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          asset_id?: string;
          asset_owner_party_id?: string | null;
          composition_node_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          installed_on?: string | null;
          manufacturer?: string | null;
          model?: string | null;
          name?: string;
          retired_on?: string | null;
          revision?: number;
          serial_number?: string | null;
          system_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_system_element";
            columns: ["tenant_id", "system_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
          {
            foreignKeyName: "inventory_items_system_element";
            columns: ["tenant_id", "system_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "boundary_system_id", "id"];
          },
          {
            foreignKeyName: "inventory_items_system_element";
            columns: ["tenant_id", "system_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "boundary_system_id", "system_id"];
          },
          {
            foreignKeyName: "inventory_items_system_element";
            columns: ["tenant_id", "system_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "boundary_system_id", "id"];
          },
          {
            foreignKeyName: "inventory_items_tenant_id_asset_owner_party_id_fkey";
            columns: ["tenant_id", "asset_owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "inventory_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "inventory_items_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "inventory_items_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "inventory_items_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      issue_evidence: {
        Row: {
          applicability_rationale: string | null;
          claim: string | null;
          created_at: string;
          created_by: string | null;
          evidence_version_id: string;
          id: string;
          issue_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id: string;
          id?: string;
          issue_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id?: string;
          id?: string;
          issue_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "issue_evidence_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "issue_evidence_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issue_evidence_tenant_id_issue_id_fkey";
            columns: ["tenant_id", "issue_id"];
            isOneToOne: false;
            referencedRelation: "operational_issues";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      issue_observations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          issue_id: string;
          observation_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          issue_id: string;
          observation_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          issue_id?: string;
          observation_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "issue_observations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issue_observations_tenant_id_issue_id_fkey";
            columns: ["tenant_id", "issue_id"];
            isOneToOne: false;
            referencedRelation: "operational_issues";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "issue_observations_tenant_id_observation_id_fkey";
            columns: ["tenant_id", "observation_id"];
            isOneToOne: false;
            referencedRelation: "observations";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      issue_poams: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          issue_id: string;
          poam_item_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          issue_id: string;
          poam_item_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          issue_id?: string;
          poam_item_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "issue_poams_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issue_poams_tenant_id_issue_id_fkey";
            columns: ["tenant_id", "issue_id"];
            isOneToOne: false;
            referencedRelation: "operational_issues";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "issue_poams_tenant_id_poam_item_id_fkey";
            columns: ["tenant_id", "poam_item_id"];
            isOneToOne: false;
            referencedRelation: "poam_items";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      library_apply_requests: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          program_id: string;
          result: Json;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          program_id: string;
          result: Json;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          payload_sha256?: string;
          program_id?: string;
          result?: Json;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "library_apply_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "library_apply_requests_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      library_assignment_targets: {
        Row: {
          assignment_id: string;
          component_contribution_id: string | null;
          control_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          implementation_id: string | null;
          note: string | null;
          requirement_revision_id: string | null;
          revision: number;
          state: string;
          system_component_id: string | null;
          system_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assignment_id: string;
          component_contribution_id?: string | null;
          control_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          implementation_id?: string | null;
          note?: string | null;
          requirement_revision_id?: string | null;
          revision?: number;
          state: string;
          system_component_id?: string | null;
          system_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assignment_id?: string;
          component_contribution_id?: string | null;
          control_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          implementation_id?: string | null;
          note?: string | null;
          requirement_revision_id?: string | null;
          revision?: number;
          state?: string;
          system_component_id?: string | null;
          system_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "library_assignment_targets_control_id_fkey";
            columns: ["control_id"];
            isOneToOne: false;
            referencedRelation: "controls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "library_assignment_targets_tenant_id_assignment_id_fkey";
            columns: ["tenant_id", "assignment_id"];
            isOneToOne: false;
            referencedRelation: "library_assignments";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignment_targets_tenant_id_component_contributio_fkey";
            columns: ["tenant_id", "component_contribution_id"];
            isOneToOne: false;
            referencedRelation: "component_contributions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignment_targets_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "library_assignment_targets_tenant_id_implementation_id_fkey";
            columns: ["tenant_id", "implementation_id"];
            isOneToOne: false;
            referencedRelation: "defined_component_implementations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignment_targets_tenant_id_requirement_revision__fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignment_targets_tenant_id_system_component_id_fkey";
            columns: ["tenant_id", "system_component_id"];
            isOneToOne: false;
            referencedRelation: "system_component_element_links";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignment_targets_tenant_id_system_component_id_fkey";
            columns: ["tenant_id", "system_component_id"];
            isOneToOne: false;
            referencedRelation: "system_components";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignment_targets_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignment_targets_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignment_targets_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "library_assignment_targets_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      library_assignments: {
        Row: {
          accepted_at: string;
          accepted_by: string | null;
          control_ids: string[] | null;
          created_at: string;
          created_by: string | null;
          id: string;
          include_descendants: boolean;
          program_id: string;
          rationale: string | null;
          request_id: string | null;
          requirement_definition_revision_id: string | null;
          revision: number;
          source_revision_id: string | null;
          state: string;
          superseded_by_id: string | null;
          system_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          accepted_at?: string;
          accepted_by?: string | null;
          control_ids?: string[] | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          include_descendants?: boolean;
          program_id: string;
          rationale?: string | null;
          request_id?: string | null;
          requirement_definition_revision_id?: string | null;
          revision?: number;
          source_revision_id?: string | null;
          state?: string;
          superseded_by_id?: string | null;
          system_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          accepted_at?: string;
          accepted_by?: string | null;
          control_ids?: string[] | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          include_descendants?: boolean;
          program_id?: string;
          rationale?: string | null;
          request_id?: string | null;
          requirement_definition_revision_id?: string | null;
          revision?: number;
          source_revision_id?: string | null;
          state?: string;
          superseded_by_id?: string | null;
          system_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "library_assignments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "library_assignments_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignments_tenant_id_requirement_definition_revis_fkey";
            columns: ["tenant_id", "requirement_definition_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_definition_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignments_tenant_id_source_revision_id_fkey";
            columns: ["tenant_id", "source_revision_id"];
            isOneToOne: false;
            referencedRelation: "component_definition_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignments_tenant_id_superseded_by_id_fkey";
            columns: ["tenant_id", "superseded_by_id"];
            isOneToOne: false;
            referencedRelation: "library_assignments";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignments_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignments_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "library_assignments_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "library_assignments_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      lifecycle_gates: {
        Row: {
          created_at: string;
          created_by: string | null;
          decided_at: string | null;
          description: string | null;
          due_on: string | null;
          id: string;
          program_id: string;
          revision: number;
          sequence_number: number | null;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          decided_at?: string | null;
          description?: string | null;
          due_on?: string | null;
          id?: string;
          program_id: string;
          revision?: number;
          sequence_number?: number | null;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          decided_at?: string | null;
          description?: string | null;
          due_on?: string | null;
          id?: string;
          program_id?: string;
          revision?: number;
          sequence_number?: number | null;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lifecycle_gates_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lifecycle_gates_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      mapping_collections: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          document_revision_id: string | null;
          id: string;
          revision: number;
          source_id: string | null;
          state: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
          version: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          document_revision_id?: string | null;
          id?: string;
          revision?: number;
          source_id?: string | null;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          version: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          document_revision_id?: string | null;
          id?: string;
          revision?: number;
          source_id?: string | null;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mapping_collections_document_revision_id_fkey";
            columns: ["document_revision_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mapping_collections_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "ref_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mapping_collections_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      mapping_endpoints: {
        Row: {
          control_id: string | null;
          control_mapping_id: string;
          control_part_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          revision: number;
          side: Database["public"]["Enums"]["mapping_endpoint_side"];
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          control_id?: string | null;
          control_mapping_id: string;
          control_part_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          side: Database["public"]["Enums"]["mapping_endpoint_side"];
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          control_id?: string | null;
          control_mapping_id?: string;
          control_part_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          side?: Database["public"]["Enums"]["mapping_endpoint_side"];
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mapping_endpoints_control_id_fkey";
            columns: ["control_id"];
            isOneToOne: false;
            referencedRelation: "controls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mapping_endpoints_control_mapping_id_fkey";
            columns: ["control_mapping_id"];
            isOneToOne: false;
            referencedRelation: "control_mappings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mapping_endpoints_control_part_id_fkey";
            columns: ["control_part_id"];
            isOneToOne: false;
            referencedRelation: "control_parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mapping_endpoints_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      observation_evidence: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          evidence_version_id: string;
          id: string;
          observation_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          evidence_version_id: string;
          id?: string;
          observation_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          evidence_version_id?: string;
          id?: string;
          observation_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "observation_evidence_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "observation_evidence_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "observation_evidence_tenant_id_observation_id_fkey";
            columns: ["tenant_id", "observation_id"];
            isOneToOne: false;
            referencedRelation: "observations";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      observations: {
        Row: {
          assessment_event_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          expires_at: string | null;
          id: string;
          method: string;
          observed_at: string | null;
          observer_party_id: string | null;
          program_id: string | null;
          revision: number;
          step_result_id: string | null;
          subject_id: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_event_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          method: string;
          observed_at?: string | null;
          observer_party_id?: string | null;
          program_id?: string | null;
          revision?: number;
          step_result_id?: string | null;
          subject_id?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_event_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          method?: string;
          observed_at?: string | null;
          observer_party_id?: string | null;
          program_id?: string | null;
          revision?: number;
          step_result_id?: string | null;
          subject_id?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "observations_program_tenant_fk";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "observations_tenant_id_assessment_event_id_fkey";
            columns: ["tenant_id", "assessment_event_id"];
            isOneToOne: false;
            referencedRelation: "assessment_events";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "observations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "observations_tenant_id_observer_party_id_fkey";
            columns: ["tenant_id", "observer_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "observations_tenant_id_step_result_id_fkey";
            columns: ["tenant_id", "step_result_id"];
            isOneToOne: false;
            referencedRelation: "step_results";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "observations_tenant_id_subject_id_fkey";
            columns: ["tenant_id", "subject_id"];
            isOneToOne: false;
            referencedRelation: "assessment_subjects";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      offered_implementations: {
        Row: {
          component_contribution_id: string;
          consumer_responsibility: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          provider_capability_id: string;
          published_at: string | null;
          revision: number;
          ssp_revision_id: string;
          state: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          component_contribution_id: string;
          consumer_responsibility?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          provider_capability_id: string;
          published_at?: string | null;
          revision?: number;
          ssp_revision_id: string;
          state?: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          component_contribution_id?: string;
          consumer_responsibility?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          provider_capability_id?: string;
          published_at?: string | null;
          revision?: number;
          ssp_revision_id?: string;
          state?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "offered_implementations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offered_implementations_tenant_id_provider_capability_id_fkey";
            columns: ["tenant_id", "provider_capability_id"];
            isOneToOne: false;
            referencedRelation: "provider_capabilities";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "offered_implementations_tenant_id_ssp_revision_id_componen_fkey";
            columns: ["tenant_id", "ssp_revision_id", "component_contribution_id"];
            isOneToOne: false;
            referencedRelation: "component_contributions";
            referencedColumns: ["tenant_id", "ssp_revision_id", "id"];
          },
        ];
      };
      operational_issues: {
        Row: {
          closed_at: string | null;
          closure_rationale: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          opened_at: string | null;
          owner_party_id: string | null;
          program_id: string;
          revision: number;
          scope_id: string | null;
          severity: string | null;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          closed_at?: string | null;
          closure_rationale?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          opened_at?: string | null;
          owner_party_id?: string | null;
          program_id: string;
          revision?: number;
          scope_id?: string | null;
          severity?: string | null;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          closed_at?: string | null;
          closure_rationale?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          opened_at?: string | null;
          owner_party_id?: string | null;
          program_id?: string;
          revision?: number;
          scope_id?: string | null;
          severity?: string | null;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "operational_issues_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operational_issues_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "operational_issues_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "operational_issues_tenant_id_scope_id_fkey";
            columns: ["tenant_id", "scope_id"];
            isOneToOne: false;
            referencedRelation: "scopes";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      oscal_document_imports: {
        Row: {
          created_at: string;
          created_by: string | null;
          document_revision_id: string;
          href: string;
          id: string;
          ordinal: number;
          referenced_revision_id: string | null;
          resolution_status: Database["public"]["Enums"]["reference_resolution_status"];
          resolved_uri: string | null;
          revision: number;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          document_revision_id: string;
          href: string;
          id?: string;
          ordinal: number;
          referenced_revision_id?: string | null;
          resolution_status: Database["public"]["Enums"]["reference_resolution_status"];
          resolved_uri?: string | null;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          document_revision_id?: string;
          href?: string;
          id?: string;
          ordinal?: number;
          referenced_revision_id?: string | null;
          resolution_status?: Database["public"]["Enums"]["reference_resolution_status"];
          resolved_uri?: string | null;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "oscal_document_imports_document_revision_id_fkey";
            columns: ["document_revision_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "oscal_document_imports_referenced_revision_id_fkey";
            columns: ["referenced_revision_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "oscal_document_imports_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      oscal_document_resources: {
        Row: {
          citation: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          document_revision_id: string;
          id: string;
          revision: number;
          source_content: Json;
          source_uuid: string;
          tenant_id: string | null;
          title: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          citation?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          document_revision_id: string;
          id?: string;
          revision?: number;
          source_content: Json;
          source_uuid: string;
          tenant_id?: string | null;
          title?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          citation?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          document_revision_id?: string;
          id?: string;
          revision?: number;
          source_content?: Json;
          source_uuid?: string;
          tenant_id?: string | null;
          title?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "oscal_document_resources_document_revision_id_fkey";
            columns: ["document_revision_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "oscal_document_resources_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      oscal_document_revisions: {
        Row: {
          content_sha256: string;
          created_at: string;
          created_by: string | null;
          document_id: string;
          document_version: string;
          id: string;
          last_modified: string;
          metadata: Json;
          original_content: Json;
          original_uri: string | null;
          oscal_version: string;
          published_at: string | null;
          revision: number;
          source_uuid: string;
          state: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          content_sha256: string;
          created_at?: string;
          created_by?: string | null;
          document_id: string;
          document_version: string;
          id?: string;
          last_modified: string;
          metadata?: Json;
          original_content: Json;
          original_uri?: string | null;
          oscal_version: string;
          published_at?: string | null;
          revision?: number;
          source_uuid: string;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          content_sha256?: string;
          created_at?: string;
          created_by?: string | null;
          document_id?: string;
          document_version?: string;
          id?: string;
          last_modified?: string;
          metadata?: Json;
          original_content?: Json;
          original_uri?: string | null;
          oscal_version?: string;
          published_at?: string | null;
          revision?: number;
          source_uuid?: string;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "oscal_document_revisions_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "oscal_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "oscal_document_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      oscal_documents: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          id: string;
          model: Database["public"]["Enums"]["oscal_model"];
          revision: number;
          source_id: string | null;
          tenant_id: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          model: Database["public"]["Enums"]["oscal_model"];
          revision?: number;
          source_id?: string | null;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          model?: Database["public"]["Enums"]["oscal_model"];
          revision?: number;
          source_id?: string | null;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "oscal_documents_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "ref_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "oscal_documents_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      package_documents: {
        Row: {
          assessment_plan_revision_id: string | null;
          assessment_results_revision_id: string | null;
          created_at: string;
          created_by: string | null;
          evidence_version_id: string | null;
          id: string;
          package_revision_id: string;
          poam_revision_id: string | null;
          revision: number;
          ssp_revision_id: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_plan_revision_id?: string | null;
          assessment_results_revision_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id?: string | null;
          id?: string;
          package_revision_id: string;
          poam_revision_id?: string | null;
          revision?: number;
          ssp_revision_id?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_plan_revision_id?: string | null;
          assessment_results_revision_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id?: string | null;
          id?: string;
          package_revision_id?: string;
          poam_revision_id?: string | null;
          revision?: number;
          ssp_revision_id?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "package_documents_tenant_id_assessment_plan_revision_id_fkey";
            columns: ["tenant_id", "assessment_plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "package_documents_tenant_id_assessment_results_revision_id_fkey";
            columns: ["tenant_id", "assessment_results_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_results_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "package_documents_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "package_documents_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "package_documents_tenant_id_package_revision_id_fkey";
            columns: ["tenant_id", "package_revision_id"];
            isOneToOne: false;
            referencedRelation: "package_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "package_documents_tenant_id_poam_revision_id_fkey";
            columns: ["tenant_id", "poam_revision_id"];
            isOneToOne: false;
            referencedRelation: "poam_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "package_documents_tenant_id_ssp_revision_id_fkey";
            columns: ["tenant_id", "ssp_revision_id"];
            isOneToOne: false;
            referencedRelation: "ssp_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      package_revisions: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          package_id: string;
          published_at: string | null;
          published_by_party_id: string | null;
          revision: number;
          state: string;
          submitted_at: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          package_id: string;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          state?: string;
          submitted_at?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          package_id?: string;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          state?: string;
          submitted_at?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "package_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "package_revisions_tenant_id_package_id_fkey";
            columns: ["tenant_id", "package_id"];
            isOneToOne: false;
            referencedRelation: "authorization_packages";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "package_revisions_tenant_id_published_by_party_id_fkey";
            columns: ["tenant_id", "published_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      parameter_choices: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          ordinal: number;
          parameter_id: string;
          revision: number;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
          value: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ordinal: number;
          parameter_id: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          value: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ordinal?: number;
          parameter_id?: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "parameter_choices_parameter_id_fkey";
            columns: ["parameter_id"];
            isOneToOne: false;
            referencedRelation: "parameters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parameter_choices_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      parameter_constraints: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          ordinal: number;
          parameter_id: string;
          revision: number;
          tenant_id: string | null;
          tests: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          ordinal: number;
          parameter_id: string;
          revision?: number;
          tenant_id?: string | null;
          tests?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          ordinal?: number;
          parameter_id?: string;
          revision?: number;
          tenant_id?: string | null;
          tests?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "parameter_constraints_parameter_id_fkey";
            columns: ["parameter_id"];
            isOneToOne: false;
            referencedRelation: "parameters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parameter_constraints_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      parameter_guidelines: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          ordinal: number;
          parameter_id: string;
          prose: string;
          revision: number;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ordinal: number;
          parameter_id: string;
          prose: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ordinal?: number;
          parameter_id?: string;
          prose?: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "parameter_guidelines_parameter_id_fkey";
            columns: ["parameter_id"];
            isOneToOne: false;
            referencedRelation: "parameters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parameter_guidelines_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      parameter_pins: {
        Row: {
          configuration_baseline_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          parameter_id: string;
          rationale: string | null;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          value: string;
          value_ordinal: number;
        };
        Insert: {
          configuration_baseline_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          parameter_id: string;
          rationale?: string | null;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          value: string;
          value_ordinal: number;
        };
        Update: {
          configuration_baseline_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          parameter_id?: string;
          rationale?: string | null;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
          value_ordinal?: number;
        };
        Relationships: [
          {
            foreignKeyName: "parameter_pins_parameter_id_fkey";
            columns: ["parameter_id"];
            isOneToOne: false;
            referencedRelation: "parameters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parameter_pins_tenant_id_configuration_baseline_id_fkey";
            columns: ["tenant_id", "configuration_baseline_id"];
            isOneToOne: false;
            referencedRelation: "configuration_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "parameter_pins_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      parameter_values: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          ordinal: number;
          parameter_id: string;
          revision: number;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
          value: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ordinal: number;
          parameter_id: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          value: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ordinal?: number;
          parameter_id?: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "parameter_values_parameter_id_fkey";
            columns: ["parameter_id"];
            isOneToOne: false;
            referencedRelation: "parameters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parameter_values_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      parameters: {
        Row: {
          catalog_revision_id: string;
          class: string | null;
          control_id: string | null;
          created_at: string;
          created_by: string | null;
          depends_on: string | null;
          group_id: string | null;
          has_selection: boolean;
          id: string;
          label: string | null;
          links: Json;
          ordinal: number;
          props: Json;
          remarks: string | null;
          revision: number;
          selection_count: Database["public"]["Enums"]["parameter_selection_count"] | null;
          source_id: string;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
          usage: string | null;
        };
        Insert: {
          catalog_revision_id: string;
          class?: string | null;
          control_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          depends_on?: string | null;
          group_id?: string | null;
          has_selection?: boolean;
          id?: string;
          label?: string | null;
          links?: Json;
          ordinal: number;
          props?: Json;
          remarks?: string | null;
          revision?: number;
          selection_count?: Database["public"]["Enums"]["parameter_selection_count"] | null;
          source_id: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          usage?: string | null;
        };
        Update: {
          catalog_revision_id?: string;
          class?: string | null;
          control_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          depends_on?: string | null;
          group_id?: string | null;
          has_selection?: boolean;
          id?: string;
          label?: string | null;
          links?: Json;
          ordinal?: number;
          props?: Json;
          remarks?: string | null;
          revision?: number;
          selection_count?: Database["public"]["Enums"]["parameter_selection_count"] | null;
          source_id?: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          usage?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "parameters_catalog_revision_id_fkey";
            columns: ["catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "catalog_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parameters_control_id_catalog_revision_id_fkey";
            columns: ["control_id", "catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "controls";
            referencedColumns: ["id", "catalog_revision_id"];
          },
          {
            foreignKeyName: "parameters_group_id_catalog_revision_id_fkey";
            columns: ["group_id", "catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "catalog_groups";
            referencedColumns: ["id", "catalog_revision_id"];
          },
          {
            foreignKeyName: "parameters_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      parties: {
        Row: {
          auth_user_id: string | null;
          created_at: string;
          created_by: string | null;
          email: string | null;
          id: string;
          name: string;
          organization_id: string | null;
          party_type: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          auth_user_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          organization_id?: string | null;
          party_type: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          auth_user_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          organization_id?: string | null;
          party_type?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "parties_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parties_tenant_id_organization_id_fkey";
            columns: ["tenant_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      poam_documents: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          program_id: string;
          revision: number;
          scope_id: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          program_id: string;
          revision?: number;
          scope_id?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          program_id?: string;
          revision?: number;
          scope_id?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "poam_documents_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poam_documents_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "poam_documents_tenant_id_scope_id_fkey";
            columns: ["tenant_id", "scope_id"];
            isOneToOne: false;
            referencedRelation: "scopes";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      poam_item_observations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          observation_id: string;
          poam_item_revision_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          observation_id: string;
          poam_item_revision_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          observation_id?: string;
          poam_item_revision_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "poam_item_observations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poam_item_observations_tenant_id_observation_id_fkey";
            columns: ["tenant_id", "observation_id"];
            isOneToOne: false;
            referencedRelation: "observations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "poam_item_observations_tenant_id_poam_item_revision_id_fkey";
            columns: ["tenant_id", "poam_item_revision_id"];
            isOneToOne: false;
            referencedRelation: "poam_item_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      poam_item_revisions: {
        Row: {
          actual_completion_date: string | null;
          completion_rationale: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          planned_completion_date: string | null;
          poam_document_id: string;
          poam_item_id: string;
          published_at: string | null;
          published_by_party_id: string | null;
          remediation_plan: string | null;
          resources: string | null;
          revision: number;
          state: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          actual_completion_date?: string | null;
          completion_rationale?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          planned_completion_date?: string | null;
          poam_document_id: string;
          poam_item_id: string;
          published_at?: string | null;
          published_by_party_id?: string | null;
          remediation_plan?: string | null;
          resources?: string | null;
          revision?: number;
          state?: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          actual_completion_date?: string | null;
          completion_rationale?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          planned_completion_date?: string | null;
          poam_document_id?: string;
          poam_item_id?: string;
          published_at?: string | null;
          published_by_party_id?: string | null;
          remediation_plan?: string | null;
          resources?: string | null;
          revision?: number;
          state?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "poam_item_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poam_item_revisions_tenant_id_poam_document_id_fkey";
            columns: ["tenant_id", "poam_document_id"];
            isOneToOne: false;
            referencedRelation: "poam_documents";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "poam_item_revisions_tenant_id_poam_document_id_poam_item_i_fkey";
            columns: ["tenant_id", "poam_document_id", "poam_item_id"];
            isOneToOne: false;
            referencedRelation: "poam_items";
            referencedColumns: ["tenant_id", "poam_document_id", "id"];
          },
          {
            foreignKeyName: "poam_item_revisions_tenant_id_published_by_party_id_fkey";
            columns: ["tenant_id", "published_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      poam_item_risks: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          poam_item_revision_id: string;
          revision: number;
          risk_revision_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          poam_item_revision_id: string;
          revision?: number;
          risk_revision_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          poam_item_revision_id?: string;
          revision?: number;
          risk_revision_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "poam_item_risks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poam_item_risks_tenant_id_poam_item_revision_id_fkey";
            columns: ["tenant_id", "poam_item_revision_id"];
            isOneToOne: false;
            referencedRelation: "poam_item_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "poam_item_risks_tenant_id_risk_revision_id_fkey";
            columns: ["tenant_id", "risk_revision_id"];
            isOneToOne: false;
            referencedRelation: "risk_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      poam_items: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          owner_party_id: string | null;
          poam_document_id: string;
          revision: number;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          owner_party_id?: string | null;
          poam_document_id: string;
          revision?: number;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          owner_party_id?: string | null;
          poam_document_id?: string;
          revision?: number;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "poam_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poam_items_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "poam_items_tenant_id_poam_document_id_fkey";
            columns: ["tenant_id", "poam_document_id"];
            isOneToOne: false;
            referencedRelation: "poam_documents";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      poam_milestones: {
        Row: {
          completed_date: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          owner_party_id: string | null;
          planned_date: string | null;
          poam_item_revision_id: string;
          revision: number;
          sequence_number: number | null;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          completed_date?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          owner_party_id?: string | null;
          planned_date?: string | null;
          poam_item_revision_id: string;
          revision?: number;
          sequence_number?: number | null;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          completed_date?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          owner_party_id?: string | null;
          planned_date?: string | null;
          poam_item_revision_id?: string;
          revision?: number;
          sequence_number?: number | null;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "poam_milestones_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poam_milestones_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "poam_milestones_tenant_id_poam_item_revision_id_fkey";
            columns: ["tenant_id", "poam_item_revision_id"];
            isOneToOne: false;
            referencedRelation: "poam_item_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      poam_revision_items: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          poam_document_id: string;
          poam_item_revision_id: string;
          poam_revision_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          poam_document_id: string;
          poam_item_revision_id: string;
          poam_revision_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          poam_document_id?: string;
          poam_item_revision_id?: string;
          poam_revision_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "poam_revision_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poam_revision_items_tenant_id_poam_document_id_poam_item_r_fkey";
            columns: ["tenant_id", "poam_document_id", "poam_item_revision_id"];
            isOneToOne: false;
            referencedRelation: "poam_item_revisions";
            referencedColumns: ["tenant_id", "poam_document_id", "id"];
          },
          {
            foreignKeyName: "poam_revision_items_tenant_id_poam_document_id_poam_revisi_fkey";
            columns: ["tenant_id", "poam_document_id", "poam_revision_id"];
            isOneToOne: false;
            referencedRelation: "poam_revisions";
            referencedColumns: ["tenant_id", "poam_document_id", "id"];
          },
        ];
      };
      poam_revisions: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          oscal_document_revision_id: string | null;
          poam_document_id: string;
          published_at: string | null;
          published_by_party_id: string | null;
          revision: number;
          ssp_revision_id: string | null;
          state: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          poam_document_id: string;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          ssp_revision_id?: string | null;
          state?: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          poam_document_id?: string;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          ssp_revision_id?: string | null;
          state?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "poam_revisions_oscal_document_revision_id_fkey";
            columns: ["oscal_document_revision_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poam_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poam_revisions_tenant_id_poam_document_id_fkey";
            columns: ["tenant_id", "poam_document_id"];
            isOneToOne: false;
            referencedRelation: "poam_documents";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "poam_revisions_tenant_id_published_by_party_id_fkey";
            columns: ["tenant_id", "published_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "poam_revisions_tenant_id_ssp_revision_id_fkey";
            columns: ["tenant_id", "ssp_revision_id"];
            isOneToOne: false;
            referencedRelation: "ssp_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      procedure_revisions: {
        Row: {
          acceptance_criterion: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          method: string;
          preconditions: string | null;
          procedure_id: string;
          published_at: string | null;
          published_by_party_id: string | null;
          revision: number;
          state: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          acceptance_criterion?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          method: string;
          preconditions?: string | null;
          procedure_id: string;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          state?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          acceptance_criterion?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          method?: string;
          preconditions?: string | null;
          procedure_id?: string;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          state?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "procedure_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "procedure_revisions_tenant_id_procedure_id_fkey";
            columns: ["tenant_id", "procedure_id"];
            isOneToOne: false;
            referencedRelation: "procedures";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "procedure_revisions_tenant_id_published_by_party_id_fkey";
            columns: ["tenant_id", "published_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      procedure_steps: {
        Row: {
          created_at: string;
          created_by: string | null;
          expected_result: string | null;
          id: string;
          instruction: string;
          procedure_revision_id: string;
          revision: number;
          sequence_number: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          expected_result?: string | null;
          id?: string;
          instruction: string;
          procedure_revision_id: string;
          revision?: number;
          sequence_number: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          expected_result?: string | null;
          id?: string;
          instruction?: string;
          procedure_revision_id?: string;
          revision?: number;
          sequence_number?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "procedure_steps_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "procedure_steps_tenant_id_procedure_revision_id_fkey";
            columns: ["tenant_id", "procedure_revision_id"];
            isOneToOne: false;
            referencedRelation: "procedure_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      procedures: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          owner_party_id: string | null;
          program_id: string | null;
          revision: number;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id?: string | null;
          revision?: number;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id?: string | null;
          revision?: number;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "procedures_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "procedures_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "procedures_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      product_configuration_elements: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          product_configuration_id: string;
          product_element_id: string;
          product_revision_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          product_configuration_id: string;
          product_element_id: string;
          product_revision_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          product_configuration_id?: string;
          product_element_id?: string;
          product_revision_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_configuration_elemen_tenant_id_product_revision_i_fkey1";
            columns: ["tenant_id", "product_revision_id", "product_element_id"];
            isOneToOne: false;
            referencedRelation: "product_elements";
            referencedColumns: ["tenant_id", "product_revision_id", "id"];
          },
          {
            foreignKeyName: "product_configuration_element_tenant_id_product_configurat_fkey";
            columns: ["tenant_id", "product_configuration_id"];
            isOneToOne: false;
            referencedRelation: "product_configurations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "product_configuration_element_tenant_id_product_revision_i_fkey";
            columns: ["tenant_id", "product_revision_id"];
            isOneToOne: false;
            referencedRelation: "product_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "product_configuration_elements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      product_configurations: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          product_id: string;
          revision: number;
          state: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          product_id: string;
          revision?: number;
          state?: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          product_id?: string;
          revision?: number;
          state?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_configurations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_configurations_tenant_id_product_id_fkey";
            columns: ["tenant_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      product_elements: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          defined_component_id: string | null;
          description: string | null;
          element_type: string;
          id: string;
          name: string;
          parent_element_id: string | null;
          position: number;
          product_revision_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          defined_component_id?: string | null;
          description?: string | null;
          element_type: string;
          id?: string;
          name: string;
          parent_element_id?: string | null;
          position?: number;
          product_revision_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          defined_component_id?: string | null;
          description?: string | null;
          element_type?: string;
          id?: string;
          name?: string;
          parent_element_id?: string | null;
          position?: number;
          product_revision_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_elements_tenant_id_defined_component_id_fkey";
            columns: ["tenant_id", "defined_component_id"];
            isOneToOne: false;
            referencedRelation: "defined_components";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "product_elements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_elements_tenant_id_product_revision_id_fkey";
            columns: ["tenant_id", "product_revision_id"];
            isOneToOne: false;
            referencedRelation: "product_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "product_elements_tenant_id_product_revision_id_parent_elem_fkey";
            columns: ["tenant_id", "product_revision_id", "parent_element_id"];
            isOneToOne: false;
            referencedRelation: "product_elements";
            referencedColumns: ["tenant_id", "product_revision_id", "id"];
          },
        ];
      };
      product_revisions: {
        Row: {
          created_at: string;
          created_by: string | null;
          effective_from: string | null;
          id: string;
          product_id: string;
          published_at: string | null;
          remarks: string | null;
          revision: number;
          state: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          effective_from?: string | null;
          id?: string;
          product_id: string;
          published_at?: string | null;
          remarks?: string | null;
          revision?: number;
          state?: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          effective_from?: string | null;
          id?: string;
          product_id?: string;
          published_at?: string | null;
          remarks?: string | null;
          revision?: number;
          state?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_revisions_tenant_id_product_id_fkey";
            columns: ["tenant_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      products: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          revision: number;
          state: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          revision?: number;
          state?: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          revision?: number;
          state?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_imports: {
        Row: {
          catalog_revision_id: string | null;
          created_at: string;
          created_by: string | null;
          document_import_id: string | null;
          href: string;
          id: string;
          imported_profile_revision_id: string | null;
          include_all: boolean;
          ordinal: number;
          profile_revision_id: string;
          revision: number;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          catalog_revision_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          document_import_id?: string | null;
          href: string;
          id?: string;
          imported_profile_revision_id?: string | null;
          include_all?: boolean;
          ordinal: number;
          profile_revision_id: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          catalog_revision_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          document_import_id?: string | null;
          href?: string;
          id?: string;
          imported_profile_revision_id?: string | null;
          include_all?: boolean;
          ordinal?: number;
          profile_revision_id?: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_imports_catalog_revision_id_fkey";
            columns: ["catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "catalog_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_imports_document_import_id_fkey";
            columns: ["document_import_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_imports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_imports_imported_profile_revision_id_fkey";
            columns: ["imported_profile_revision_id"];
            isOneToOne: false;
            referencedRelation: "profile_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_imports_profile_revision_id_fkey";
            columns: ["profile_revision_id"];
            isOneToOne: false;
            referencedRelation: "profile_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_imports_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_parameter_settings: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          label: string | null;
          parameter_id: string | null;
          parameter_source_id: string;
          profile_revision_id: string;
          rationale: string | null;
          revision: number;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
          usage: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label?: string | null;
          parameter_id?: string | null;
          parameter_source_id: string;
          profile_revision_id: string;
          rationale?: string | null;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          usage?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label?: string | null;
          parameter_id?: string | null;
          parameter_source_id?: string;
          profile_revision_id?: string;
          rationale?: string | null;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          usage?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_parameter_settings_parameter_id_fkey";
            columns: ["parameter_id"];
            isOneToOne: false;
            referencedRelation: "parameters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_parameter_settings_profile_revision_id_fkey";
            columns: ["profile_revision_id"];
            isOneToOne: false;
            referencedRelation: "profile_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_parameter_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_parameter_values: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          ordinal: number;
          revision: number;
          setting_id: string;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
          value: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ordinal: number;
          revision?: number;
          setting_id: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          value: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ordinal?: number;
          revision?: number;
          setting_id?: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_parameter_values_setting_id_fkey";
            columns: ["setting_id"];
            isOneToOne: false;
            referencedRelation: "profile_parameter_settings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_parameter_values_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_resolution_inputs: {
        Row: {
          created_at: string;
          created_by: string | null;
          document_revision_id: string;
          id: string;
          ordinal: number;
          profile_resolution_id: string;
          revision: number;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          document_revision_id: string;
          id?: string;
          ordinal: number;
          profile_resolution_id: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          document_revision_id?: string;
          id?: string;
          ordinal?: number;
          profile_resolution_id?: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_resolution_inputs_document_revision_id_fkey";
            columns: ["document_revision_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_resolution_inputs_profile_resolution_id_fkey";
            columns: ["profile_resolution_id"];
            isOneToOne: false;
            referencedRelation: "profile_resolutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_resolution_inputs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_resolutions: {
        Row: {
          base_profile_resolution_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          input_sha256: string;
          output_sha256: string;
          profile_revision_id: string;
          resolved_at: string;
          resolver_name: string;
          resolver_version: string;
          revision: number;
          state: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          base_profile_resolution_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          input_sha256: string;
          output_sha256: string;
          profile_revision_id: string;
          resolved_at?: string;
          resolver_name: string;
          resolver_version: string;
          revision?: number;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          base_profile_resolution_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          input_sha256?: string;
          output_sha256?: string;
          profile_revision_id?: string;
          resolved_at?: string;
          resolver_name?: string;
          resolver_version?: string;
          revision?: number;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_resolutions_base_profile_resolution_id_fkey";
            columns: ["base_profile_resolution_id"];
            isOneToOne: false;
            referencedRelation: "profile_resolutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_resolutions_profile_revision_id_fkey";
            columns: ["profile_revision_id"];
            isOneToOne: false;
            referencedRelation: "profile_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_resolutions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_revisions: {
        Row: {
          created_at: string;
          created_by: string | null;
          document_revision_id: string;
          id: string;
          profile_id: string;
          revision: number;
          state: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
          version: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          document_revision_id: string;
          id?: string;
          profile_id: string;
          revision?: number;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          version: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          document_revision_id?: string;
          id?: string;
          profile_id?: string;
          revision?: number;
          state?: Database["public"]["Enums"]["reference_revision_state"];
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_revisions_document_revision_id_fkey";
            columns: ["document_revision_id"];
            isOneToOne: true;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_revisions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_rules: {
        Row: {
          created_at: string;
          created_by: string | null;
          definition: Json;
          id: string;
          kind: Database["public"]["Enums"]["profile_rule_kind"];
          ordinal: number;
          profile_import_id: string | null;
          profile_revision_id: string;
          rationale: string | null;
          revision: number;
          source_pointer: string;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          definition: Json;
          id?: string;
          kind: Database["public"]["Enums"]["profile_rule_kind"];
          ordinal: number;
          profile_import_id?: string | null;
          profile_revision_id: string;
          rationale?: string | null;
          revision?: number;
          source_pointer: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          definition?: Json;
          id?: string;
          kind?: Database["public"]["Enums"]["profile_rule_kind"];
          ordinal?: number;
          profile_import_id?: string | null;
          profile_revision_id?: string;
          rationale?: string | null;
          revision?: number;
          source_pointer?: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_rules_profile_import_id_profile_revision_id_fkey";
            columns: ["profile_import_id", "profile_revision_id"];
            isOneToOne: false;
            referencedRelation: "profile_imports";
            referencedColumns: ["id", "profile_revision_id"];
          },
          {
            foreignKeyName: "profile_rules_profile_revision_id_fkey";
            columns: ["profile_revision_id"];
            isOneToOne: false;
            referencedRelation: "profile_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_rules_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          id: string;
          revision: number;
          source_id: string | null;
          tenant_id: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          source_id?: string | null;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          source_id?: string | null;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "ref_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      program_reference_choices: {
        Row: {
          catalog_revision_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          profile_resolution_id: string;
          program_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          catalog_revision_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          profile_resolution_id: string;
          program_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          catalog_revision_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          profile_resolution_id?: string;
          program_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "program_reference_choices_catalog_revision_id_fkey";
            columns: ["catalog_revision_id"];
            isOneToOne: false;
            referencedRelation: "catalog_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_reference_choices_profile_resolution_id_fkey";
            columns: ["profile_resolution_id"];
            isOneToOne: false;
            referencedRelation: "profile_resolutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_reference_choices_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_reference_choices_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      program_role_assignments: {
        Row: {
          created_at: string;
          created_by: string | null;
          ends_on: string | null;
          id: string;
          party_id: string;
          program_id: string;
          revision: number;
          role: string;
          starts_on: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          ends_on?: string | null;
          id?: string;
          party_id: string;
          program_id: string;
          revision?: number;
          role: string;
          starts_on?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          ends_on?: string | null;
          id?: string;
          party_id?: string;
          program_id?: string;
          revision?: number;
          role?: string;
          starts_on?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "program_role_assignments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_role_assignments_tenant_id_party_id_fkey";
            columns: ["tenant_id", "party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "program_role_assignments_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      program_wizard_requests: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          program_id: string;
          result: Json;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          program_id: string;
          result: Json;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          payload_sha256?: string;
          program_id?: string;
          result?: Json;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "program_wizard_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_wizard_requests_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      programs: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_on: string | null;
          id: string;
          name: string;
          revision: number;
          sponsor_party_id: string | null;
          starts_on: string | null;
          status: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_on?: string | null;
          id?: string;
          name: string;
          revision?: number;
          sponsor_party_id?: string | null;
          starts_on?: string | null;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_on?: string | null;
          id?: string;
          name?: string;
          revision?: number;
          sponsor_party_id?: string | null;
          starts_on?: string | null;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "programs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_tenant_id_sponsor_party_id_fkey";
            columns: ["tenant_id", "sponsor_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      provider_capabilities: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          provider_party_id: string | null;
          providing_system_id: string | null;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          provider_party_id?: string | null;
          providing_system_id?: string | null;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          provider_party_id?: string | null;
          providing_system_id?: string | null;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "provider_capabilities_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "provider_capabilities_tenant_id_provider_party_id_fkey";
            columns: ["tenant_id", "provider_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "provider_capabilities_tenant_id_providing_system_id_fkey";
            columns: ["tenant_id", "providing_system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "provider_capabilities_tenant_id_providing_system_id_fkey";
            columns: ["tenant_id", "providing_system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "provider_capabilities_tenant_id_providing_system_id_fkey";
            columns: ["tenant_id", "providing_system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "provider_capabilities_tenant_id_providing_system_id_fkey";
            columns: ["tenant_id", "providing_system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      ref_sources: {
        Row: {
          authoritative: boolean;
          authority: string;
          code: string;
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          revision: number;
          rights: string | null;
          source_uri: string;
          tenant_id: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          authoritative: boolean;
          authority: string;
          code: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          revision?: number;
          rights?: string | null;
          source_uri: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          authoritative?: boolean;
          authority?: string;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          revision?: number;
          rights?: string | null;
          source_uri?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ref_sources_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      requirement_allocations: {
        Row: {
          composition_node_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          provider_capability_id: string | null;
          rationale: string | null;
          requirement_revision_id: string;
          revision: number;
          security_process_id: string | null;
          system_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          composition_node_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          provider_capability_id?: string | null;
          rationale?: string | null;
          requirement_revision_id: string;
          revision?: number;
          security_process_id?: string | null;
          system_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          composition_node_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          provider_capability_id?: string | null;
          rationale?: string | null;
          requirement_revision_id?: string;
          revision?: number;
          security_process_id?: string | null;
          system_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_allocations_legacy_system_element";
            columns: ["tenant_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_allocations_legacy_system_element";
            columns: ["tenant_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_allocations_legacy_system_element";
            columns: ["tenant_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "requirement_allocations_legacy_system_element";
            columns: ["tenant_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_allocations_system";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_allocations_system";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_allocations_system";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "requirement_allocations_system";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_allocations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_allocations_tenant_id_provider_capability_id_fkey";
            columns: ["tenant_id", "provider_capability_id"];
            isOneToOne: false;
            referencedRelation: "provider_capabilities";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_allocations_tenant_id_requirement_revision_id_fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_allocations_tenant_id_security_process_id_fkey";
            columns: ["tenant_id", "security_process_id"];
            isOneToOne: false;
            referencedRelation: "security_processes";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      requirement_applicability: {
        Row: {
          created_at: string;
          created_by: string | null;
          decided_at: string;
          decided_by_party_id: string;
          decision: string;
          id: string;
          rationale: string;
          requirement_revision_id: string;
          revision: number;
          scope_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          decided_at: string;
          decided_by_party_id: string;
          decision: string;
          id?: string;
          rationale: string;
          requirement_revision_id: string;
          revision?: number;
          scope_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          decided_at?: string;
          decided_by_party_id?: string;
          decision?: string;
          id?: string;
          rationale?: string;
          requirement_revision_id?: string;
          revision?: number;
          scope_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_applicability_tenant_id_decided_by_party_id_fkey";
            columns: ["tenant_id", "decided_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_applicability_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_applicability_tenant_id_requirement_revision_i_fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_applicability_tenant_id_scope_id_fkey";
            columns: ["tenant_id", "scope_id"];
            isOneToOne: false;
            referencedRelation: "scopes";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      requirement_control_links: {
        Row: {
          control_id: string;
          control_part_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          rationale: string | null;
          relationship_type: string;
          requirement_revision_id: string;
          revision: number;
          selected_control_id: string | null;
          system_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          control_id: string;
          control_part_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          rationale?: string | null;
          relationship_type: string;
          requirement_revision_id: string;
          revision?: number;
          selected_control_id?: string | null;
          system_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          control_id?: string;
          control_part_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          rationale?: string | null;
          relationship_type?: string;
          requirement_revision_id?: string;
          revision?: number;
          selected_control_id?: string | null;
          system_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_control_links_control_id_fkey";
            columns: ["control_id"];
            isOneToOne: false;
            referencedRelation: "controls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_control_links_control_part_id_fkey";
            columns: ["control_part_id"];
            isOneToOne: false;
            referencedRelation: "control_parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_control_links_selected_control_id_fkey";
            columns: ["selected_control_id"];
            isOneToOne: false;
            referencedRelation: "selected_controls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_control_links_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_control_links_tenant_id_requirement_revision_i_fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_control_links_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_control_links_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_control_links_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "requirement_control_links_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      requirement_decompositions: {
        Row: {
          child_requirement_revision_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          parent_requirement_revision_id: string;
          rationale: string | null;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          child_requirement_revision_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          parent_requirement_revision_id: string;
          rationale?: string | null;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          child_requirement_revision_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          parent_requirement_revision_id?: string;
          rationale?: string | null;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_decompositions_tenant_id_child_requirement_rev_fkey";
            columns: ["tenant_id", "child_requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_decompositions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_decompositions_tenant_id_parent_requirement_re_fkey";
            columns: ["tenant_id", "parent_requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      requirement_definition_revisions: {
        Row: {
          acceptance_criteria: string;
          created_at: string;
          created_by: string | null;
          id: string;
          published_at: string | null;
          rationale: string | null;
          requirement_definition_id: string;
          requirement_type: string;
          revision: number;
          state: string;
          statement: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          acceptance_criteria: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          published_at?: string | null;
          rationale?: string | null;
          requirement_definition_id: string;
          requirement_type: string;
          revision?: number;
          state?: string;
          statement: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          acceptance_criteria?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          published_at?: string | null;
          rationale?: string | null;
          requirement_definition_id?: string;
          requirement_type?: string;
          revision?: number;
          state?: string;
          statement?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_definition_revisi_tenant_id_requirement_defini_fkey";
            columns: ["tenant_id", "requirement_definition_id"];
            isOneToOne: false;
            referencedRelation: "requirement_definitions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_definition_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      requirement_definitions: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          revision: number;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          revision?: number;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          revision?: number;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_definitions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      requirement_edit_requests: {
        Row: {
          activity_event_id: string | null;
          content_id: string | null;
          created_at: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          result: Json;
          tenant_id: string;
        };
        Insert: {
          activity_event_id?: string | null;
          content_id?: string | null;
          created_at?: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          result: Json;
          tenant_id: string;
        };
        Update: {
          activity_event_id?: string | null;
          content_id?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          payload_sha256?: string;
          result?: Json;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_edit_requests_tenant_id_activity_event_id_fkey";
            columns: ["tenant_id", "activity_event_id"];
            isOneToOne: false;
            referencedRelation: "activity_events";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_edit_requests_tenant_id_content_id_fkey";
            columns: ["tenant_id", "content_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_edit_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      requirement_evidence: {
        Row: {
          applicability_rationale: string | null;
          claim: string | null;
          created_at: string;
          created_by: string | null;
          evidence_version_id: string;
          id: string;
          requirement_revision_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id: string;
          id?: string;
          requirement_revision_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id?: string;
          id?: string;
          requirement_revision_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_evidence_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_evidence_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_evidence_tenant_id_requirement_revision_id_fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      requirement_implementations: {
        Row: {
          component_contribution_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          implemented_requirement_id: string | null;
          rationale: string | null;
          requirement_revision_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          component_contribution_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          implemented_requirement_id?: string | null;
          rationale?: string | null;
          requirement_revision_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          component_contribution_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          implemented_requirement_id?: string | null;
          rationale?: string | null;
          requirement_revision_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_implementation_control";
            columns: ["tenant_id", "implemented_requirement_id"];
            isOneToOne: false;
            referencedRelation: "implemented_requirements";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_implementations_tenant_id_component_contributi_fkey";
            columns: ["tenant_id", "component_contribution_id"];
            isOneToOne: false;
            referencedRelation: "component_contributions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_implementations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_implementations_tenant_id_requirement_revision_fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      requirement_revision_requests: {
        Row: {
          activity_event_id: string | null;
          created_at: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          result: Json;
          result_revision_id: string | null;
          source_revision_id: string | null;
          tenant_id: string;
        };
        Insert: {
          activity_event_id?: string | null;
          created_at?: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          result: Json;
          result_revision_id?: string | null;
          source_revision_id?: string | null;
          tenant_id: string;
        };
        Update: {
          activity_event_id?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          payload_sha256?: string;
          result?: Json;
          result_revision_id?: string | null;
          source_revision_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_revision_requests_tenant_id_activity_event_id_fkey";
            columns: ["tenant_id", "activity_event_id"];
            isOneToOne: false;
            referencedRelation: "activity_events";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_revision_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_revision_requests_tenant_id_result_revision_id_fkey";
            columns: ["tenant_id", "result_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_revision_requests_tenant_id_source_revision_id_fkey";
            columns: ["tenant_id", "source_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      requirement_revisions: {
        Row: {
          acceptance_criteria: string;
          created_at: string;
          created_by: string | null;
          engineering_requirement_id: string;
          id: string;
          owner_party_id: string | null;
          published_at: string | null;
          rationale: string | null;
          requirement_type: string;
          revision: number;
          state: string;
          statement: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          acceptance_criteria: string;
          created_at?: string;
          created_by?: string | null;
          engineering_requirement_id: string;
          id?: string;
          owner_party_id?: string | null;
          published_at?: string | null;
          rationale?: string | null;
          requirement_type: string;
          revision?: number;
          state?: string;
          statement: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          acceptance_criteria?: string;
          created_at?: string;
          created_by?: string | null;
          engineering_requirement_id?: string;
          id?: string;
          owner_party_id?: string | null;
          published_at?: string | null;
          rationale?: string | null;
          requirement_type?: string;
          revision?: number;
          state?: string;
          statement?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_revisions_tenant_id_engineering_requirement_id_fkey";
            columns: ["tenant_id", "engineering_requirement_id"];
            isOneToOne: false;
            referencedRelation: "engineering_requirements";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_revisions_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      requirement_verifications: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          procedure_revision_id: string;
          rationale: string | null;
          requirement_revision_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          procedure_revision_id: string;
          rationale?: string | null;
          requirement_revision_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          procedure_revision_id?: string;
          rationale?: string | null;
          requirement_revision_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "requirement_verifications_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requirement_verifications_tenant_id_procedure_revision_id_fkey";
            columns: ["tenant_id", "procedure_revision_id"];
            isOneToOne: false;
            referencedRelation: "procedure_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "requirement_verifications_tenant_id_requirement_revision_i_fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      result_observations: {
        Row: {
          assessment_results_revision_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          observation_id: string;
          result_set_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_results_revision_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          observation_id: string;
          result_set_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_results_revision_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          observation_id?: string;
          result_set_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "result_observations_tenant_id_assessment_results_revision__fkey";
            columns: ["tenant_id", "assessment_results_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_results_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "result_observations_tenant_id_assessment_results_revision_fkey1";
            columns: ["tenant_id", "assessment_results_revision_id", "result_set_id"];
            isOneToOne: false;
            referencedRelation: "result_sets";
            referencedColumns: ["tenant_id", "assessment_results_revision_id", "id"];
          },
          {
            foreignKeyName: "result_observations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_observations_tenant_id_observation_id_fkey";
            columns: ["tenant_id", "observation_id"];
            isOneToOne: false;
            referencedRelation: "observations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "result_observations_tenant_id_result_set_id_fkey";
            columns: ["tenant_id", "result_set_id"];
            isOneToOne: false;
            referencedRelation: "result_sets";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      result_sets: {
        Row: {
          assessment_results_revision_id: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          revision: number;
          starts_at: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_results_revision_id: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          revision?: number;
          starts_at?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_results_revision_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          revision?: number;
          starts_at?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "result_sets_tenant_id_assessment_results_revision_id_fkey";
            columns: ["tenant_id", "assessment_results_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_results_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "result_sets_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      review_decisions: {
        Row: {
          created_at: string;
          created_by: string | null;
          decided_at: string;
          decision: string;
          evidence_version_id: string | null;
          gate_criterion_id: string | null;
          id: string;
          package_revision_id: string | null;
          rationale: string;
          reviewer_party_id: string;
          revision: number;
          risk_revision_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          decided_at: string;
          decision: string;
          evidence_version_id?: string | null;
          gate_criterion_id?: string | null;
          id?: string;
          package_revision_id?: string | null;
          rationale: string;
          reviewer_party_id: string;
          revision?: number;
          risk_revision_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          decided_at?: string;
          decision?: string;
          evidence_version_id?: string | null;
          gate_criterion_id?: string | null;
          id?: string;
          package_revision_id?: string | null;
          rationale?: string;
          reviewer_party_id?: string;
          revision?: number;
          risk_revision_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "review_decisions_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "review_decisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_decisions_tenant_id_gate_criterion_id_fkey";
            columns: ["tenant_id", "gate_criterion_id"];
            isOneToOne: false;
            referencedRelation: "gate_criteria";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "review_decisions_tenant_id_package_revision_id_fkey";
            columns: ["tenant_id", "package_revision_id"];
            isOneToOne: false;
            referencedRelation: "package_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "review_decisions_tenant_id_reviewer_party_id_fkey";
            columns: ["tenant_id", "reviewer_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "review_decisions_tenant_id_risk_revision_id_fkey";
            columns: ["tenant_id", "risk_revision_id"];
            isOneToOne: false;
            referencedRelation: "risk_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      risk_observations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          observation_id: string;
          revision: number;
          risk_revision_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          observation_id: string;
          revision?: number;
          risk_revision_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          observation_id?: string;
          revision?: number;
          risk_revision_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "risk_observations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risk_observations_tenant_id_observation_id_fkey";
            columns: ["tenant_id", "observation_id"];
            isOneToOne: false;
            referencedRelation: "observations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "risk_observations_tenant_id_risk_revision_id_fkey";
            columns: ["tenant_id", "risk_revision_id"];
            isOneToOne: false;
            referencedRelation: "risk_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      risk_responses: {
        Row: {
          approved_at: string | null;
          approved_by_party_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_at: string | null;
          id: string;
          owner_party_id: string | null;
          response_type: string;
          revision: number;
          risk_revision_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by_party_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          owner_party_id?: string | null;
          response_type: string;
          revision?: number;
          risk_revision_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by_party_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          owner_party_id?: string | null;
          response_type?: string;
          revision?: number;
          risk_revision_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "risk_responses_tenant_id_approved_by_party_id_fkey";
            columns: ["tenant_id", "approved_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "risk_responses_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risk_responses_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "risk_responses_tenant_id_risk_revision_id_fkey";
            columns: ["tenant_id", "risk_revision_id"];
            isOneToOne: false;
            referencedRelation: "risk_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      risk_revisions: {
        Row: {
          assessed_at: string | null;
          assessment_rationale: string | null;
          assessor_party_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          impact: string | null;
          likelihood: string | null;
          published_at: string | null;
          published_by_party_id: string | null;
          revision: number;
          risk_id: string;
          severity: string | null;
          state: string;
          tenant_id: string;
          threat: string | null;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
          vulnerability: string | null;
        };
        Insert: {
          assessed_at?: string | null;
          assessment_rationale?: string | null;
          assessor_party_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          impact?: string | null;
          likelihood?: string | null;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          risk_id: string;
          severity?: string | null;
          state?: string;
          tenant_id: string;
          threat?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
          vulnerability?: string | null;
        };
        Update: {
          assessed_at?: string | null;
          assessment_rationale?: string | null;
          assessor_party_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          impact?: string | null;
          likelihood?: string | null;
          published_at?: string | null;
          published_by_party_id?: string | null;
          revision?: number;
          risk_id?: string;
          severity?: string | null;
          state?: string;
          tenant_id?: string;
          threat?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
          vulnerability?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "risk_revisions_tenant_id_assessor_party_id_fkey";
            columns: ["tenant_id", "assessor_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "risk_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risk_revisions_tenant_id_published_by_party_id_fkey";
            columns: ["tenant_id", "published_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "risk_revisions_tenant_id_risk_id_fkey";
            columns: ["tenant_id", "risk_id"];
            isOneToOne: false;
            referencedRelation: "risks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      risks: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          owner_party_id: string | null;
          program_id: string;
          revision: number;
          scope_id: string | null;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id: string;
          revision?: number;
          scope_id?: string | null;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id?: string;
          revision?: number;
          scope_id?: string | null;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "risks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risks_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "risks_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "risks_tenant_id_scope_id_fkey";
            columns: ["tenant_id", "scope_id"];
            isOneToOne: false;
            referencedRelation: "scopes";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      scheduled_assessment_tasks: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_at: string | null;
          id: string;
          owner_party_id: string | null;
          plan_revision_id: string;
          revision: number;
          starts_at: string | null;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          owner_party_id?: string | null;
          plan_revision_id: string;
          revision?: number;
          starts_at?: string | null;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          owner_party_id?: string | null;
          plan_revision_id?: string;
          revision?: number;
          starts_at?: string | null;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scheduled_assessment_tasks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scheduled_assessment_tasks_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "scheduled_assessment_tasks_tenant_id_plan_revision_id_fkey";
            columns: ["tenant_id", "plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      scope_baselines: {
        Row: {
          adopted_at: string;
          adopted_by_party_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          profile_resolution_id: string;
          rationale: string | null;
          revision: number;
          scope_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          adopted_at: string;
          adopted_by_party_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          profile_resolution_id: string;
          rationale?: string | null;
          revision?: number;
          scope_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          adopted_at?: string;
          adopted_by_party_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          profile_resolution_id?: string;
          rationale?: string | null;
          revision?: number;
          scope_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scope_baselines_profile_resolution_id_fkey";
            columns: ["profile_resolution_id"];
            isOneToOne: false;
            referencedRelation: "profile_resolutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scope_baselines_tenant_id_adopted_by_party_id_fkey";
            columns: ["tenant_id", "adopted_by_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "scope_baselines_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scope_baselines_tenant_id_scope_id_fkey";
            columns: ["tenant_id", "scope_id"];
            isOneToOne: false;
            referencedRelation: "scopes";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      scopes: {
        Row: {
          availability_impact: string | null;
          categorization_rationale: string | null;
          code: string;
          composition_node_id: string | null;
          confidentiality_impact: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          integrity_impact: string | null;
          name: string;
          revision: number;
          system_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          availability_impact?: string | null;
          categorization_rationale?: string | null;
          code: string;
          composition_node_id?: string | null;
          confidentiality_impact?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          integrity_impact?: string | null;
          name: string;
          revision?: number;
          system_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          availability_impact?: string | null;
          categorization_rationale?: string | null;
          code?: string;
          composition_node_id?: string | null;
          confidentiality_impact?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          integrity_impact?: string | null;
          name?: string;
          revision?: number;
          system_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scopes_system_element";
            columns: ["tenant_id", "system_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
          {
            foreignKeyName: "scopes_system_element";
            columns: ["tenant_id", "system_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "boundary_system_id", "id"];
          },
          {
            foreignKeyName: "scopes_system_element";
            columns: ["tenant_id", "system_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "boundary_system_id", "system_id"];
          },
          {
            foreignKeyName: "scopes_system_element";
            columns: ["tenant_id", "system_id", "composition_node_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "boundary_system_id", "id"];
          },
          {
            foreignKeyName: "scopes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scopes_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "scopes_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "scopes_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "scopes_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      security_processes: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          owner_party_id: string | null;
          program_id: string;
          revision: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          owner_party_id?: string | null;
          program_id: string;
          revision?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          owner_party_id?: string | null;
          program_id?: string;
          revision?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "security_processes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "security_processes_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "security_processes_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      selected_controls: {
        Row: {
          control_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          ordinal: number;
          profile_resolution_id: string;
          revision: number;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          control_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ordinal: number;
          profile_resolution_id: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          control_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          ordinal?: number;
          profile_resolution_id?: string;
          revision?: number;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "selected_controls_control_id_fkey";
            columns: ["control_id"];
            isOneToOne: false;
            referencedRelation: "controls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "selected_controls_profile_resolution_id_fkey";
            columns: ["profile_resolution_id"];
            isOneToOne: false;
            referencedRelation: "profile_resolutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "selected_controls_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      selection_provenance: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          profile_import_id: string;
          profile_rule_id: string | null;
          rationale: string | null;
          revision: number;
          selected_control_id: string;
          source_pointer: string;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          profile_import_id: string;
          profile_rule_id?: string | null;
          rationale?: string | null;
          revision?: number;
          selected_control_id: string;
          source_pointer: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          profile_import_id?: string;
          profile_rule_id?: string | null;
          rationale?: string | null;
          revision?: number;
          selected_control_id?: string;
          source_pointer?: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "selection_provenance_profile_import_id_fkey";
            columns: ["profile_import_id"];
            isOneToOne: false;
            referencedRelation: "profile_imports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "selection_provenance_profile_rule_id_fkey";
            columns: ["profile_rule_id"];
            isOneToOne: false;
            referencedRelation: "profile_rules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "selection_provenance_selected_control_id_fkey";
            columns: ["selected_control_id"];
            isOneToOne: false;
            referencedRelation: "selected_controls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "selection_provenance_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      ssp_revisions: {
        Row: {
          configuration_baseline_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          oscal_document_revision_id: string | null;
          oscal_uuid: string | null;
          profile_resolution_id: string;
          published_at: string | null;
          revision: number;
          state: string;
          system_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version_number: number;
        };
        Insert: {
          configuration_baseline_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          oscal_uuid?: string | null;
          profile_resolution_id: string;
          published_at?: string | null;
          revision?: number;
          state?: string;
          system_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number: number;
        };
        Update: {
          configuration_baseline_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          oscal_document_revision_id?: string | null;
          oscal_uuid?: string | null;
          profile_resolution_id?: string;
          published_at?: string | null;
          revision?: number;
          state?: string;
          system_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ssp_revisions_oscal_document_revision_id_fkey";
            columns: ["oscal_document_revision_id"];
            isOneToOne: false;
            referencedRelation: "oscal_document_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ssp_revisions_profile_resolution_id_fkey";
            columns: ["profile_resolution_id"];
            isOneToOne: false;
            referencedRelation: "profile_resolutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ssp_revisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ssp_revisions_tenant_id_system_id_configuration_baseline_i_fkey";
            columns: ["tenant_id", "system_id", "configuration_baseline_id"];
            isOneToOne: false;
            referencedRelation: "configuration_baselines";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
          {
            foreignKeyName: "ssp_revisions_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "ssp_revisions_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "ssp_revisions_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "ssp_revisions_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      step_result_evidence: {
        Row: {
          applicability_rationale: string | null;
          claim: string | null;
          created_at: string;
          created_by: string | null;
          evidence_version_id: string;
          id: string;
          revision: number;
          step_result_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id: string;
          id?: string;
          revision?: number;
          step_result_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id?: string;
          id?: string;
          revision?: number;
          step_result_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "step_result_evidence_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "step_result_evidence_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "step_result_evidence_tenant_id_step_result_id_fkey";
            columns: ["tenant_id", "step_result_id"];
            isOneToOne: false;
            referencedRelation: "step_results";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      step_results: {
        Row: {
          assessor_party_id: string | null;
          created_at: string;
          created_by: string | null;
          determination: string;
          id: string;
          observed_behavior: string | null;
          procedure_revision_id: string;
          procedure_step_id: string;
          recorded_at: string | null;
          revision: number;
          tenant_id: string;
          test_run_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessor_party_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          determination: string;
          id?: string;
          observed_behavior?: string | null;
          procedure_revision_id: string;
          procedure_step_id: string;
          recorded_at?: string | null;
          revision?: number;
          tenant_id: string;
          test_run_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessor_party_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          determination?: string;
          id?: string;
          observed_behavior?: string | null;
          procedure_revision_id?: string;
          procedure_step_id?: string;
          recorded_at?: string | null;
          revision?: number;
          tenant_id?: string;
          test_run_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "step_results_tenant_id_assessor_party_id_fkey";
            columns: ["tenant_id", "assessor_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "step_results_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "step_results_tenant_id_procedure_revision_id_procedure_ste_fkey";
            columns: ["tenant_id", "procedure_revision_id", "procedure_step_id"];
            isOneToOne: false;
            referencedRelation: "procedure_steps";
            referencedColumns: ["tenant_id", "procedure_revision_id", "id"];
          },
          {
            foreignKeyName: "step_results_tenant_id_procedure_revision_id_test_run_id_fkey";
            columns: ["tenant_id", "procedure_revision_id", "test_run_id"];
            isOneToOne: false;
            referencedRelation: "test_runs";
            referencedColumns: ["tenant_id", "procedure_revision_id", "id"];
          },
        ];
      };
      system_baseline_requests: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          result: Json;
          system_id: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          result: Json;
          system_id: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          payload_sha256?: string;
          result?: Json;
          system_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "system_baseline_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "system_baseline_requests_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "system_baseline_requests_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "system_baseline_requests_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "system_baseline_requests_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      system_components: {
        Row: {
          applied_at: string | null;
          applied_by: string | null;
          applied_rationale: string | null;
          assignment_id: string | null;
          code: string;
          component_type: string;
          created_at: string;
          created_by: string | null;
          defined_component_id: string | null;
          description: string | null;
          id: string;
          name: string;
          revision: number;
          status: string;
          system_element_id: string | null;
          system_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version: string | null;
        };
        Insert: {
          applied_at?: string | null;
          applied_by?: string | null;
          applied_rationale?: string | null;
          assignment_id?: string | null;
          code: string;
          component_type: string;
          created_at?: string;
          created_by?: string | null;
          defined_component_id?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          revision?: number;
          status?: string;
          system_element_id?: string | null;
          system_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: string | null;
        };
        Update: {
          applied_at?: string | null;
          applied_by?: string | null;
          applied_rationale?: string | null;
          assignment_id?: string | null;
          code?: string;
          component_type?: string;
          created_at?: string;
          created_by?: string | null;
          defined_component_id?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          revision?: number;
          status?: string;
          system_element_id?: string | null;
          system_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "system_component_assignment";
            columns: ["tenant_id", "assignment_id"];
            isOneToOne: false;
            referencedRelation: "library_assignments";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "system_components_element_context";
            columns: ["tenant_id", "system_id", "system_element_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "system_id", "id"];
          },
          {
            foreignKeyName: "system_components_element_context";
            columns: ["tenant_id", "system_id", "system_element_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "boundary_system_id", "id"];
          },
          {
            foreignKeyName: "system_components_element_context";
            columns: ["tenant_id", "system_id", "system_element_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "boundary_system_id", "system_id"];
          },
          {
            foreignKeyName: "system_components_element_context";
            columns: ["tenant_id", "system_id", "system_element_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "boundary_system_id", "id"];
          },
          {
            foreignKeyName: "system_components_tenant_id_defined_component_id_fkey";
            columns: ["tenant_id", "defined_component_id"];
            isOneToOne: false;
            referencedRelation: "defined_components";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "system_components_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "system_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "system_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "system_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "system_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      systems: {
        Row: {
          adopted_profile_resolution_id: string | null;
          authorization_status: string | null;
          availability_impact: string | null;
          baseline_rationale: string | null;
          boundary_system_id: string;
          categorization_rationale: string | null;
          code: string;
          confidentiality_impact: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          integrity_impact: string | null;
          is_authorization_boundary: boolean;
          lifecycle_status: string | null;
          name: string;
          parent_system_id: string | null;
          product_configuration_id: string | null;
          product_element_id: string | null;
          product_revision_id: string | null;
          program_id: string;
          revision: number;
          system_owner_party_id: string | null;
          system_type: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          adopted_profile_resolution_id?: string | null;
          authorization_status?: string | null;
          availability_impact?: string | null;
          baseline_rationale?: string | null;
          boundary_system_id: string;
          categorization_rationale?: string | null;
          code: string;
          confidentiality_impact?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          integrity_impact?: string | null;
          is_authorization_boundary?: boolean;
          lifecycle_status?: string | null;
          name: string;
          parent_system_id?: string | null;
          product_configuration_id?: string | null;
          product_element_id?: string | null;
          product_revision_id?: string | null;
          program_id: string;
          revision?: number;
          system_owner_party_id?: string | null;
          system_type: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          adopted_profile_resolution_id?: string | null;
          authorization_status?: string | null;
          availability_impact?: string | null;
          baseline_rationale?: string | null;
          boundary_system_id?: string;
          categorization_rationale?: string | null;
          code?: string;
          confidentiality_impact?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          integrity_impact?: string | null;
          is_authorization_boundary?: boolean;
          lifecycle_status?: string | null;
          name?: string;
          parent_system_id?: string | null;
          product_configuration_id?: string | null;
          product_element_id?: string | null;
          product_revision_id?: string | null;
          program_id?: string;
          revision?: number;
          system_owner_party_id?: string | null;
          system_type?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "systems_adopted_profile_resolution_id_fkey";
            columns: ["adopted_profile_resolution_id"];
            isOneToOne: false;
            referencedRelation: "profile_resolutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "systems_boundary_context";
            columns: ["tenant_id", "program_id", "boundary_system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "program_id", "id"];
          },
          {
            foreignKeyName: "systems_parent_context";
            columns: ["tenant_id", "program_id", "parent_system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "program_id", "id"];
          },
          {
            foreignKeyName: "systems_product_configuration";
            columns: ["tenant_id", "product_configuration_id"];
            isOneToOne: false;
            referencedRelation: "product_configurations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "systems_product_element";
            columns: ["tenant_id", "product_revision_id", "product_element_id"];
            isOneToOne: false;
            referencedRelation: "product_elements";
            referencedColumns: ["tenant_id", "product_revision_id", "id"];
          },
          {
            foreignKeyName: "systems_product_revision";
            columns: ["tenant_id", "product_revision_id"];
            isOneToOne: false;
            referencedRelation: "product_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "systems_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "systems_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "systems_tenant_id_system_owner_party_id_fkey";
            columns: ["tenant_id", "system_owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      task_activities: {
        Row: {
          activity_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          plan_revision_id: string;
          revision: number;
          task_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          plan_revision_id: string;
          revision?: number;
          task_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          plan_revision_id?: string;
          revision?: number;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_activities_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_activities_tenant_id_plan_revision_id_activity_id_fkey";
            columns: ["tenant_id", "plan_revision_id", "activity_id"];
            isOneToOne: false;
            referencedRelation: "assessment_activities";
            referencedColumns: ["tenant_id", "plan_revision_id", "id"];
          },
          {
            foreignKeyName: "task_activities_tenant_id_plan_revision_id_fkey";
            columns: ["tenant_id", "plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "task_activities_tenant_id_plan_revision_id_task_id_fkey";
            columns: ["tenant_id", "plan_revision_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "scheduled_assessment_tasks";
            referencedColumns: ["tenant_id", "plan_revision_id", "id"];
          },
        ];
      };
      task_assessments: {
        Row: {
          assessment_task_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          revision: number;
          task_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_task_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          task_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_task_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_assessments_tenant_id_assessment_task_id_fkey";
            columns: ["tenant_id", "assessment_task_id"];
            isOneToOne: false;
            referencedRelation: "scheduled_assessment_tasks";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "task_assessments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_assessments_tenant_id_task_id_fkey";
            columns: ["tenant_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      task_assignments: {
        Row: {
          assignment_role: string;
          created_at: string;
          created_by: string | null;
          id: string;
          party_id: string;
          revision: number;
          task_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assignment_role: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          party_id: string;
          revision?: number;
          task_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assignment_role?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          party_id?: string;
          revision?: number;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_assignments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_assignments_tenant_id_party_id_fkey";
            columns: ["tenant_id", "party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "task_assignments_tenant_id_task_id_fkey";
            columns: ["tenant_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      task_create_requests: {
        Row: {
          assignment_id: string | null;
          created_at: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          task_id: string | null;
          tenant_id: string;
        };
        Insert: {
          assignment_id?: string | null;
          created_at?: string;
          created_by: string;
          id: string;
          payload_sha256: string;
          task_id?: string | null;
          tenant_id: string;
        };
        Update: {
          assignment_id?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          payload_sha256?: string;
          task_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_create_requests_tenant_id_assignment_id_fkey";
            columns: ["tenant_id", "assignment_id"];
            isOneToOne: false;
            referencedRelation: "task_assignments";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "task_create_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_create_requests_tenant_id_task_id_fkey";
            columns: ["tenant_id", "task_id"];
            isOneToOne: true;
            referencedRelation: "tasks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      task_evidence: {
        Row: {
          applicability_rationale: string | null;
          claim: string | null;
          created_at: string;
          created_by: string | null;
          evidence_version_id: string;
          id: string;
          revision: number;
          task_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id: string;
          id?: string;
          revision?: number;
          task_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id?: string;
          id?: string;
          revision?: number;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_evidence_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "task_evidence_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_evidence_tenant_id_task_id_fkey";
            columns: ["tenant_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      task_implementations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          implemented_requirement_id: string;
          revision: number;
          task_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          implemented_requirement_id: string;
          revision?: number;
          task_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          implemented_requirement_id?: string;
          revision?: number;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_implementations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_implementations_tenant_id_implemented_requirement_id_fkey";
            columns: ["tenant_id", "implemented_requirement_id"];
            isOneToOne: false;
            referencedRelation: "implemented_requirements";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "task_implementations_tenant_id_task_id_fkey";
            columns: ["tenant_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      task_issues: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          issue_id: string;
          revision: number;
          task_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          issue_id: string;
          revision?: number;
          task_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          issue_id?: string;
          revision?: number;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_issues_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_issues_tenant_id_issue_id_fkey";
            columns: ["tenant_id", "issue_id"];
            isOneToOne: false;
            referencedRelation: "operational_issues";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "task_issues_tenant_id_task_id_fkey";
            columns: ["tenant_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      task_poams: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          poam_item_id: string;
          revision: number;
          task_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          poam_item_id: string;
          revision?: number;
          task_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          poam_item_id?: string;
          revision?: number;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_poams_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_poams_tenant_id_poam_item_id_fkey";
            columns: ["tenant_id", "poam_item_id"];
            isOneToOne: false;
            referencedRelation: "poam_items";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "task_poams_tenant_id_task_id_fkey";
            columns: ["tenant_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      task_requirements: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          requirement_revision_id: string;
          revision: number;
          task_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          requirement_revision_id: string;
          revision?: number;
          task_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          requirement_revision_id?: string;
          revision?: number;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_requirements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_requirements_tenant_id_requirement_revision_id_fkey";
            columns: ["tenant_id", "requirement_revision_id"];
            isOneToOne: false;
            referencedRelation: "requirement_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "task_requirements_tenant_id_task_id_fkey";
            columns: ["tenant_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      task_risks: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          revision: number;
          risk_id: string;
          task_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          risk_id: string;
          task_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          revision?: number;
          risk_id?: string;
          task_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_risks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_risks_tenant_id_risk_id_fkey";
            columns: ["tenant_id", "risk_id"];
            isOneToOne: false;
            referencedRelation: "risks";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "task_risks_tenant_id_task_id_fkey";
            columns: ["tenant_id", "task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      tasks: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_at: string | null;
          id: string;
          priority: string | null;
          program_id: string;
          revision: number;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          workstream_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          priority?: string | null;
          program_id: string;
          revision?: number;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          workstream_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          priority?: string | null;
          program_id?: string;
          revision?: number;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          workstream_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "tasks_tenant_id_workstream_id_fkey";
            columns: ["tenant_id", "workstream_id"];
            isOneToOne: false;
            referencedRelation: "workstreams";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      tenant_memberships: {
        Row: {
          created_at: string;
          role: string;
          tenant_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role: string;
          tenant_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: string;
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          personal_owner_id: string | null;
          revision: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          personal_owner_id?: string | null;
          revision?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          personal_owner_id?: string | null;
          revision?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      test_run_evidence: {
        Row: {
          applicability_rationale: string | null;
          claim: string | null;
          created_at: string;
          created_by: string | null;
          evidence_version_id: string;
          id: string;
          revision: number;
          tenant_id: string;
          test_run_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id: string;
          id?: string;
          revision?: number;
          tenant_id: string;
          test_run_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          applicability_rationale?: string | null;
          claim?: string | null;
          created_at?: string;
          created_by?: string | null;
          evidence_version_id?: string;
          id?: string;
          revision?: number;
          tenant_id?: string;
          test_run_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "test_run_evidence_tenant_id_evidence_version_id_fkey";
            columns: ["tenant_id", "evidence_version_id"];
            isOneToOne: false;
            referencedRelation: "evidence_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "test_run_evidence_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "test_run_evidence_tenant_id_test_run_id_fkey";
            columns: ["tenant_id", "test_run_id"];
            isOneToOne: false;
            referencedRelation: "test_runs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      test_runs: {
        Row: {
          assessment_event_id: string | null;
          assessment_task_id: string | null;
          assessor_party_id: string | null;
          completed_at: string | null;
          conclusion: string | null;
          configuration_baseline_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          plan_revision_id: string | null;
          procedure_revision_id: string;
          revision: number;
          started_at: string | null;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_event_id?: string | null;
          assessment_task_id?: string | null;
          assessor_party_id?: string | null;
          completed_at?: string | null;
          conclusion?: string | null;
          configuration_baseline_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          plan_revision_id?: string | null;
          procedure_revision_id: string;
          revision?: number;
          started_at?: string | null;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_event_id?: string | null;
          assessment_task_id?: string | null;
          assessor_party_id?: string | null;
          completed_at?: string | null;
          conclusion?: string | null;
          configuration_baseline_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          plan_revision_id?: string | null;
          procedure_revision_id?: string;
          revision?: number;
          started_at?: string | null;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "test_runs_tenant_id_assessment_event_id_fkey";
            columns: ["tenant_id", "assessment_event_id"];
            isOneToOne: false;
            referencedRelation: "assessment_events";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "test_runs_tenant_id_assessment_task_id_fkey";
            columns: ["tenant_id", "assessment_task_id"];
            isOneToOne: false;
            referencedRelation: "scheduled_assessment_tasks";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "test_runs_tenant_id_assessor_party_id_fkey";
            columns: ["tenant_id", "assessor_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "test_runs_tenant_id_configuration_baseline_id_fkey";
            columns: ["tenant_id", "configuration_baseline_id"];
            isOneToOne: false;
            referencedRelation: "configuration_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "test_runs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "test_runs_tenant_id_plan_revision_id_assessment_event_id_fkey";
            columns: ["tenant_id", "plan_revision_id", "assessment_event_id"];
            isOneToOne: false;
            referencedRelation: "assessment_events";
            referencedColumns: ["tenant_id", "plan_revision_id", "id"];
          },
          {
            foreignKeyName: "test_runs_tenant_id_plan_revision_id_assessment_task_id_fkey";
            columns: ["tenant_id", "plan_revision_id", "assessment_task_id"];
            isOneToOne: false;
            referencedRelation: "scheduled_assessment_tasks";
            referencedColumns: ["tenant_id", "plan_revision_id", "id"];
          },
          {
            foreignKeyName: "test_runs_tenant_id_plan_revision_id_fkey";
            columns: ["tenant_id", "plan_revision_id"];
            isOneToOne: false;
            referencedRelation: "assessment_plan_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "test_runs_tenant_id_procedure_revision_id_fkey";
            columns: ["tenant_id", "procedure_revision_id"];
            isOneToOne: false;
            referencedRelation: "procedure_revisions";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      workspace_snapshots: {
        Row: {
          owner_id: string;
          revision: number;
          updated_at: string;
          values: Json;
        };
        Insert: {
          owner_id: string;
          revision: number;
          updated_at?: string;
          values: Json;
        };
        Update: {
          owner_id?: string;
          revision?: number;
          updated_at?: string;
          values?: Json;
        };
        Relationships: [];
      };
      workstreams: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_on: string | null;
          id: string;
          owner_party_id: string | null;
          program_id: string;
          revision: number;
          starts_on: string | null;
          status: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_on?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id: string;
          revision?: number;
          starts_on?: string | null;
          status?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_on?: string | null;
          id?: string;
          owner_party_id?: string | null;
          program_id?: string;
          revision?: number;
          starts_on?: string | null;
          status?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workstreams_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workstreams_tenant_id_owner_party_id_fkey";
            columns: ["tenant_id", "owner_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "workstreams_tenant_id_program_id_fkey";
            columns: ["tenant_id", "program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
    };
    Views: {
      composition_nodes: {
        Row: {
          code: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string | null;
          name: string | null;
          node_type: string | null;
          parent_id: string | null;
          revision: number | null;
          system_id: string | null;
          tenant_id: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          code?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          name?: string | null;
          node_type?: string | null;
          parent_id?: never;
          revision?: number | null;
          system_id?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          code?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          name?: string | null;
          node_type?: string | null;
          parent_id?: never;
          revision?: number | null;
          system_id?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "systems_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_resolution_catalogs: {
        Row: {
          base_profile_resolution_id: string | null;
          catalog_revision_id: string | null;
          depth: number | null;
          id: string | null;
          layered: boolean | null;
          profile_resolution_id: string | null;
          profile_revision_id: string | null;
          root_profile_resolution_id: string | null;
          tenant_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_resolutions_base_profile_resolution_id_fkey";
            columns: ["base_profile_resolution_id"];
            isOneToOne: false;
            referencedRelation: "profile_resolutions";
            referencedColumns: ["id"];
          },
        ];
      };
      system_component_element_links: {
        Row: {
          id: string | null;
          inventory_element_count: number | null;
          link_source: string | null;
          system_element_id: string | null;
          system_id: string | null;
          tenant_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "system_components_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "system_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "composition_nodes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "system_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "system_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "system_effective_baselines";
            referencedColumns: ["tenant_id", "system_id"];
          },
          {
            foreignKeyName: "system_components_tenant_id_system_id_fkey";
            columns: ["tenant_id", "system_id"];
            isOneToOne: false;
            referencedRelation: "systems";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      system_effective_baselines: {
        Row: {
          boundary_system_id: string | null;
          id: string | null;
          inherited: boolean | null;
          profile_resolution_id: string | null;
          source_label: string | null;
          source_system_id: string | null;
          system_id: string | null;
          tenant_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "systems_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      add_program_system: {
        Args: {
          p_program_id: string;
          p_request_id: string;
          p_system: Json;
          p_tenant_id: string;
        };
        Returns: Json;
      };
      adopt_requirement_definition: {
        Args: {
          p_program_id: string;
          p_request_id: string;
          p_selection: Json;
          p_tenant_id: string;
        };
        Returns: Json;
      };
      adopt_system_baseline: {
        Args: {
          p_expected_revision: number;
          p_request_id: string;
          p_selection: Json;
          p_system_id: string;
          p_tenant_id: string;
        };
        Returns: Json;
      };
      app_schema: { Args: never; Returns: Json };
      apply_library_component: {
        Args: {
          p_assignment_id: string;
          p_code: string;
          p_control_filter: string[];
          p_defined: Database["public"]["Tables"]["defined_components"]["Row"];
          p_excluded: Json;
          p_name: string;
          p_program_id: string;
          p_rationale: string;
          p_revision: Database["public"]["Tables"]["component_definition_revisions"]["Row"];
          p_target: Database["public"]["Tables"]["systems"]["Row"];
          p_tenant_id: string;
        };
        Returns: Json;
      };
      apply_library_source: {
        Args: {
          p_program_id: string;
          p_request_id: string;
          p_selection: Json;
          p_tenant_id: string;
        };
        Returns: Json;
      };
      apply_tenant_security: {
        Args: { table_name: string };
        Returns: undefined;
      };
      attach_parent_immutability: {
        Args: {
          child_table: string;
          parent_column: string;
          parent_table: string;
        };
        Returns: undefined;
      };
      attach_record_lifecycle: {
        Args: { immutable_when_published?: boolean; table_name: string };
        Returns: undefined;
      };
      attach_reference_tenant_guard: {
        Args: {
          child_column: string;
          child_table: string;
          reference_table: string;
        };
        Returns: undefined;
      };
      author_tailored_profile: {
        Args: {
          p_base_resolution_id: string;
          p_catalog_id: string;
          p_code: string;
          p_decisions: Json;
          p_parameters: Json;
          p_remarks: string;
          p_tenant_id: string;
          p_title: string;
        };
        Returns: string;
      };
      can_access_evidence_object: {
        Args: { object_name: string; writing?: boolean };
        Returns: boolean;
      };
      can_admin_tenant: { Args: { target_tenant: string }; Returns: boolean };
      can_own_tenant: { Args: { target_tenant: string }; Returns: boolean };
      can_read_tenant: { Args: { target_tenant: string }; Returns: boolean };
      can_write_tenant: { Args: { target_tenant: string }; Returns: boolean };
      copy_product_revision: {
        Args: { p_source_revision_id: string; p_tenant_id: string };
        Returns: string;
      };
      create_evidence_with_version: {
        Args: { p_evidence: Json; p_request_id: string; p_tenant_id: string };
        Returns: Json;
      };
      create_program_system: {
        Args: {
          p_profile_resolution_id: string;
          p_program_id: string;
          p_request_id: string;
          p_system: Json;
          p_tenant_id: string;
        };
        Returns: Json;
      };
      create_program_wizard: {
        Args: { p_draft: Json; p_tenant_id: string };
        Returns: Json;
      };
      create_task_with_assignment: {
        Args: { p_request_id: string; p_task: Json; p_tenant_id: string };
        Returns: Json;
      };
      decide_evidence_use: {
        Args: {
          p_decision: string;
          p_expected_revision: number;
          p_rationale: string;
          p_tenant_id: string;
          p_use_id: string;
        };
        Returns: Json;
      };
      edit_requirement: {
        Args: {
          p_content_id: string;
          p_expected_revision: number;
          p_patch: Json;
          p_request_id: string;
          p_requirement_id: string;
          p_tenant_id: string;
        };
        Returns: Json;
      };
      element_type_for_component: {
        Args: { component_type: string };
        Returns: string;
      };
      ensure_personal_tenant: { Args: never; Returns: string };
      is_requirement_control_statement: {
        Args: { p_control_id: string; p_part_id: string };
        Returns: boolean;
      };
      link_requirement_evidence: {
        Args: {
          p_evidence_version_ids: string[];
          p_program_id: string;
          p_requirement_revision_id: string;
          p_tenant_id: string;
        };
        Returns: Json;
      };
      product_component_definition: {
        Args: { p_revision_id: string; p_tenant_id: string };
        Returns: Json;
      };
      product_export_control_implementations: {
        Args: {
          p_defined: Database["public"]["Tables"]["defined_components"]["Row"];
          p_definition_label: string;
          p_element_id: string;
          p_element_name: string;
        };
        Returns: Json;
      };
      product_export_prop: {
        Args: { p_name: string; p_value: string };
        Returns: Json;
      };
      product_export_uuid: { Args: { seed: string }; Returns: string };
      reference_owner: { Args: { table_name: string }; Returns: string[] };
      resolve_base_controls: {
        Args: {
          p_catalog_id: string;
          p_depth?: number;
          p_resolution_id: string;
          p_tenant_id: string;
        };
        Returns: string[];
      };
      revise_requirement: {
        Args: {
          p_expected_revision: number;
          p_force_new?: boolean;
          p_patch: Json;
          p_request_id: string;
          p_source_revision_id: string;
          p_tenant_id: string;
        };
        Returns: Json;
      };
      save_workspace_snapshot: {
        Args: { expected_revision: number; snapshot: Json };
        Returns: number;
      };
      seed_library_contribution: {
        Args: {
          p_assignment_id: string;
          p_excluded: boolean;
          p_impl: Database["public"]["Tables"]["defined_component_implementations"]["Row"];
          p_note: string;
          p_program_id: string;
          p_ssp_id: string;
          p_ssp_resolution_id: string;
          p_system_component_id: string;
          p_system_id: string;
          p_tenant_id: string;
        };
        Returns: Json;
      };
      update_library_assignment: {
        Args: {
          p_assignment_id: string;
          p_new_revision_id: string;
          p_rationale: string;
          p_request_id: string;
          p_tenant_id: string;
        };
        Returns: Json;
      };
      wizard_base_controls: {
        Args: {
          p_catalog_id: string;
          p_resolution_id: string;
          p_tenant_id: string;
        };
        Returns: string[];
      };
      wizard_control_order: {
        Args: { source_identifier: string };
        Returns: string;
      };
      wizard_required_text: {
        Args: { field_name: string; value: Json };
        Returns: string;
      };
    };
    Enums: {
      cci_status: "draft" | "active" | "deprecated";
      cci_type: "policy" | "technical";
      control_publication_status: "active" | "withdrawn";
      mapping_endpoint_side: "source" | "target";
      mapping_relationship:
        "equivalent-to" | "subset-of" | "superset-of" | "intersects-with" | "no-relationship";
      oscal_model:
        | "catalog"
        | "profile"
        | "component-definition"
        | "system-security-plan"
        | "assessment-plan"
        | "assessment-results"
        | "plan-of-action-and-milestones"
        | "mapping-collection";
      parameter_selection_count: "one" | "one-or-more";
      profile_rule_kind: "include" | "exclude" | "merge" | "set-parameter" | "alter";
      reference_resolution_status: "resolved" | "unresolved" | "unsupported-publication";
      reference_revision_state: "draft" | "published";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      cci_status: ["draft", "active", "deprecated"],
      cci_type: ["policy", "technical"],
      control_publication_status: ["active", "withdrawn"],
      mapping_endpoint_side: ["source", "target"],
      mapping_relationship: [
        "equivalent-to",
        "subset-of",
        "superset-of",
        "intersects-with",
        "no-relationship",
      ],
      oscal_model: [
        "catalog",
        "profile",
        "component-definition",
        "system-security-plan",
        "assessment-plan",
        "assessment-results",
        "plan-of-action-and-milestones",
        "mapping-collection",
      ],
      parameter_selection_count: ["one", "one-or-more"],
      profile_rule_kind: ["include", "exclude", "merge", "set-parameter", "alter"],
      reference_resolution_status: ["resolved", "unresolved", "unsupported-publication"],
      reference_revision_state: ["draft", "published"],
    },
  },
} as const;
