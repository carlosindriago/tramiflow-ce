import type { Tables, TablesInsert, TablesUpdate } from './database.types'

/**
 * Domain Entity Types (Rows)
 */
export type AppAdmin = Tables<'app_admins'>
export type AuditLog = Tables<'audit_logs'>
export type Category = Tables<'categories'>
export type Client = Tables<'clients'>
export type Document = Tables<'documents'>
export type Lead = Tables<'leads'>
export type Notification = Tables<'notifications'>
export type OrganizationMember = Tables<'organization_members'>
export type Organization = Tables<'organizations'>
export type PaymentReport = Tables<'payment_reports'>
export type ProcedureDocument = Tables<'procedure_documents'>
export type ProcedureNote = Tables<'procedure_notes'>
export type ProcedureStatus = Tables<'procedure_statuses'>
export type ProcedureTemplate = Tables<'procedure_templates'>
export type Procedure = Tables<'procedures'>
export type Profile = Tables<'profiles'>
export type SubscriptionPlan = Tables<'subscription_plans'>
export type SystemSetting = Tables<'system_settings'>
export type TemplateLead = Tables<'template_leads'>
export type TemplatePermission = Tables<'template_permissions'>
export type TemplateView = Tables<'template_views'>
export type UsageLog = Tables<'usage_logs'>

/**
 * Insert Types
 */
export type AppAdminInsert = TablesInsert<'app_admins'>
export type AuditLogInsert = TablesInsert<'audit_logs'>
export type CategoryInsert = TablesInsert<'categories'>
export type ClientInsert = TablesInsert<'clients'>
export type DocumentInsert = TablesInsert<'documents'>
export type LeadInsert = TablesInsert<'leads'>
export type NotificationInsert = TablesInsert<'notifications'>
export type OrganizationMemberInsert = TablesInsert<'organization_members'>
export type OrganizationInsert = TablesInsert<'organizations'>
export type PaymentReportInsert = TablesInsert<'payment_reports'>
export type ProcedureDocumentInsert = TablesInsert<'procedure_documents'>
export type ProcedureNoteInsert = TablesInsert<'procedure_notes'>
export type ProcedureStatusInsert = TablesInsert<'procedure_statuses'>
export type ProcedureTemplateInsert = TablesInsert<'procedure_templates'>
export type ProcedureInsert = TablesInsert<'procedures'>
export type ProfileInsert = TablesInsert<'profiles'>
export type SubscriptionPlanInsert = TablesInsert<'subscription_plans'>
export type SystemSettingInsert = TablesInsert<'system_settings'>
export type TemplateLeadInsert = TablesInsert<'template_leads'>
export type TemplatePermissionInsert = TablesInsert<'template_permissions'>
export type TemplateViewInsert = TablesInsert<'template_views'>
export type UsageLogInsert = TablesInsert<'usage_logs'>

/**
 * Update Types
 */
export type AppAdminUpdate = TablesUpdate<'app_admins'>
export type AuditLogUpdate = TablesUpdate<'audit_logs'>
export type CategoryUpdate = TablesUpdate<'categories'>
export type ClientUpdate = TablesUpdate<'clients'>
export type DocumentUpdate = TablesUpdate<'documents'>
export type LeadUpdate = TablesUpdate<'leads'>
export type NotificationUpdate = TablesUpdate<'notifications'>
export type OrganizationMemberUpdate = TablesUpdate<'organization_members'>
export type OrganizationUpdate = TablesUpdate<'organizations'>
export type PaymentReportUpdate = TablesUpdate<'payment_reports'>
export type ProcedureDocumentUpdate = TablesUpdate<'procedure_documents'>
export type ProcedureNoteUpdate = TablesUpdate<'procedure_notes'>
export type ProcedureStatusUpdate = TablesUpdate<'procedure_statuses'>
export type ProcedureTemplateUpdate = TablesUpdate<'procedure_templates'>
export type ProcedureUpdate = TablesUpdate<'procedures'>
export type ProfileUpdate = TablesUpdate<'profiles'>
export type SubscriptionPlanUpdate = TablesUpdate<'subscription_plans'>
export type SystemSettingUpdate = TablesUpdate<'system_settings'>
export type TemplateLeadUpdate = TablesUpdate<'template_leads'>
export type TemplatePermissionUpdate = TablesUpdate<'template_permissions'>
export type TemplateViewUpdate = TablesUpdate<'template_views'>
export type UsageLogUpdate = TablesUpdate<'usage_logs'>
