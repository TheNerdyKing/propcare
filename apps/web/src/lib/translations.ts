export type Language = 'de' | 'en';

export type TranslationKey = 
  | 'sidebar_dashboard'
  | 'sidebar_tickets'
  | 'sidebar_properties'
  | 'sidebar_contractors'
  | 'sidebar_reporting'
  | 'sidebar_audit'
  | 'sidebar_live_portal'
  | 'sidebar_logout'
  | 'sidebar_system_online'
  | 'dashboard_welcome_title'
  | 'dashboard_welcome_subtitle'
  | 'dashboard_metrics_total'
  | 'dashboard_metrics_open'
  | 'dashboard_metrics_resolved'
  | 'dashboard_recent_activity'
  | 'dashboard_see_all';

export const translations: Record<Language, Record<string, string>> = {
  de: {
    sidebar_dashboard: 'Dashboard',
    sidebar_tickets: 'Meldungen',
    sidebar_properties: 'Liegenschaften',
    sidebar_contractors: 'Handwerker',
    sidebar_reporting: 'Reporting',
    sidebar_audit: 'Protokoll',
    sidebar_live_portal: 'Live Portal',
    sidebar_logout: 'Session Abmelden',
    sidebar_system_online: 'System Online',
    dashboard_welcome_title: 'Live Dashboard',
    dashboard_welcome_subtitle: 'Systemstatus und aktuelle Performance-Metriken Ihrer Liegenschaften im Überblick.',
    dashboard_metrics_total: 'Eingang Total',
    dashboard_metrics_open: 'In Bearbeitung',
    dashboard_metrics_resolved: 'Abgeschlossen',
    dashboard_recent_activity: 'Letzte Vorgänge',
    dashboard_see_all: 'Gesamte Liste',
  },
  en: {
    sidebar_dashboard: 'Dashboard',
    sidebar_tickets: 'Tickets',
    sidebar_properties: 'Properties',
    sidebar_contractors: 'Contractors',
    sidebar_reporting: 'Analytics',
    sidebar_audit: 'Audit Log',
    sidebar_live_portal: 'Public Portal',
    sidebar_logout: 'Logout Session',
    sidebar_system_online: 'System Active',
    dashboard_welcome_title: 'Live Dashboard',
    dashboard_welcome_subtitle: 'Overview of system status and performance metrics for all your properties.',
    dashboard_metrics_total: 'Total Intake',
    dashboard_metrics_open: 'In Progress',
    dashboard_metrics_resolved: 'Resolved',
    dashboard_recent_activity: 'Recent Activity',
    dashboard_see_all: 'Full List',
  }
};
