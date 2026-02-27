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
  | 'sidebar_role_owner'
  | 'sidebar_role_team'
  | 'dashboard_welcome_title'
  | 'dashboard_welcome_subtitle'
  | 'dashboard_metrics_total'
  | 'dashboard_metrics_open'
  | 'dashboard_metrics_resolved'
  | 'dashboard_recent_activity'
  | 'dashboard_see_all'
  | 'audit_title'
  | 'audit_subtitle'
  | 'audit_badge'
  | 'audit_live_status'
  | 'audit_system_active'
  | 'audit_header_timeline'
  | 'audit_header_type'
  | 'audit_header_actor'
  | 'audit_header_details'
  | 'audit_identity'
  | 'audit_reference'
  | 'audit_export_title'
  | 'audit_export_subtitle'
  | 'audit_btn_export'
  | 'audit_btn_generating'
  | 'tickets_title'
  | 'tickets_subtitle'
  | 'tickets_btn_create'
  | 'tickets_stat_total'
  | 'tickets_stat_new'
  | 'tickets_stat_active'
  | 'tickets_stat_done'
  | 'tickets_filter_search'
  | 'tickets_filter_all'
  | 'tickets_table_ref'
  | 'tickets_table_object'
  | 'tickets_table_priority'
  | 'tickets_table_status'
  | 'tickets_table_details'
  | 'ticket_back'
  | 'ticket_live_view'
  | 'ticket_unit'
  | 'ticket_urgency'
  | 'ticket_category'
  | 'ticket_created_at'
  | 'ticket_description'
  | 'ticket_tab_ai'
  | 'ticket_tab_history'
  | 'ticket_status_new'
  | 'ticket_status_in_progress'
  | 'ticket_status_completed'
  | 'ticket_ai_intelligence'
  | 'ticket_ai_reprocess'
  | 'ticket_ai_processing'
  | 'ticket_ai_suggested_category'
  | 'ticket_ai_suggested_urgency'
  | 'ticket_ai_missing_info'
  | 'ticket_ai_suggested_contractors'
  | 'ticket_ai_google_maps'
  | 'ticket_ai_email_draft'
  | 'ticket_ai_email_purpose'
  | 'ticket_ai_send_to_contractor'
  | 'ticket_system_log'
  | 'ticket_sidebar_tenant'
  | 'ticket_sidebar_email'
  | 'ticket_sidebar_phone'
  | 'ticket_sidebar_automation_title'
  | 'ticket_sidebar_automation_desc'
  | 'properties_title'
  | 'properties_subtitle'
  | 'properties_btn_add'
  | 'properties_btn_import'
  | 'properties_table_name'
  | 'properties_table_units'
  | 'properties_table_active'
  | 'properties_table_actions'
  | 'contractors_title'
  | 'contractors_subtitle'
  | 'contractors_btn_add'
  | 'contractors_filter_search'
  | 'contractors_stat_total'
  | 'contractors_stat_active'
  | 'contractors_trade_labels'
  | 'contractors_btn_call'
  | 'contractors_btn_email';

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
    sidebar_role_owner: 'Inhaber',
    sidebar_role_team: 'Team',
    dashboard_welcome_title: 'Live Dashboard',
    dashboard_welcome_subtitle: 'Systemstatus und aktuelle Performance-Metriken Ihrer Liegenschaften im Überblick.',
    dashboard_metrics_total: 'Eingang Total',
    dashboard_metrics_open: 'In Bearbeitung',
    dashboard_metrics_resolved: 'Abgeschlossen',
    dashboard_recent_activity: 'Letzte Vorgänge',
    dashboard_see_all: 'Gesamte Liste',
    audit_title: 'System Protokoll',
    audit_subtitle: 'Vollständige Transparenz über alle Backend-Aktivitäten, KI-Workflows und Datentransfers.',
    audit_badge: 'Sicherheit & Compliance',
    audit_live_status: 'Live Status',
    audit_system_active: 'System Aktiv',
    audit_header_timeline: 'Zeitstrahl',
    audit_header_type: 'Prozess-Typ',
    audit_header_actor: 'Akteur',
    audit_header_details: 'Details & Ausführung',
    audit_identity: 'Identität',
    audit_reference: 'Referenz',
    audit_export_title: 'Audit Export benötigt?',
    audit_export_subtitle: 'Alle Systemaktivitäten werden unveränderlich gespeichert und können für Compliance-Zwecke als signierte Berichte exportiert werden.',
    audit_btn_export: 'In PDF Exportieren',
    audit_btn_generating: 'GENERIERE PDF...',
    tickets_title: 'Alle Meldungen',
    tickets_subtitle: 'Zentrale Verwaltung aller Mieteranliegen, Reparaturaufträge und Schadensmeldungen.',
    tickets_btn_create: 'Meldung Erfassen',
    tickets_stat_total: 'Gesamt',
    tickets_stat_new: 'Neu',
    tickets_stat_active: 'Aktiv',
    tickets_stat_done: 'Erledigt',
    tickets_filter_search: 'Suchen nach Referenz, Gebäude oder Mieter...',
    tickets_filter_all: 'Filter: Alle Status',
    tickets_table_ref: 'Referenz',
    tickets_table_object: 'Objekt & Einheit',
    tickets_table_priority: 'Priorität',
    tickets_table_status: 'Status',
    tickets_table_details: 'Details',
    ticket_back: 'Zurück',
    ticket_live_view: 'Live Ansicht',
    ticket_unit: 'Einheit',
    ticket_urgency: 'Dringlichkeit',
    ticket_category: 'Kategorie',
    ticket_created_at: 'Erstellt am',
    ticket_description: 'Beschreibung',
    ticket_tab_ai: 'Assistent & Analyse',
    ticket_tab_history: 'Versionsverlauf',
    ticket_status_new: 'NEU ERFASST',
    ticket_status_in_progress: 'IN BEARBEITUNG',
    ticket_status_completed: 'ABGESCHLOSSEN',
    ticket_ai_intelligence: 'KI Intelligenz',
    ticket_ai_reprocess: 'Neu Analysieren',
    ticket_ai_processing: 'Verarbeite Daten...',
    ticket_ai_suggested_category: 'Vorgeschlagene Kategorie',
    ticket_ai_suggested_urgency: 'KI-Dringlichkeit',
    ticket_ai_missing_info: 'Kritische Lücken in der Meldung',
    ticket_ai_suggested_contractors: 'Vorgeschlagene Fachpartner',
    ticket_ai_google_maps: 'Auf Google Maps suchen ➔',
    ticket_ai_email_draft: 'E-Mail Entwurf',
    ticket_ai_email_purpose: 'Für Handwerker-Beauftragung',
    ticket_ai_send_to_contractor: 'Senden an Handwerker',
    ticket_system_log: 'Systemprotokoll',
    ticket_sidebar_tenant: 'Mieterprofil',
    ticket_sidebar_email: 'E-Mail Adresse',
    ticket_sidebar_phone: 'Telefon',
    ticket_sidebar_automation_title: 'Automatisierung',
    ticket_sidebar_automation_desc: '"Die KI analysiert jede Meldung automatisch und schlägt Handwerker sowie E-Mail-Entwürfe vor, um Ihre Bearbeitungszeit zu minimieren."',
    properties_title: 'Portfolio Übersicht',
    properties_subtitle: 'Verwalten Sie Ihren Liegenschaftsbestand, Gebäude-Informationen und zugeordnete Einheiten.',
    properties_btn_add: 'Haus Hinzufügen',
    properties_btn_import: 'Excel Import',
    properties_table_name: 'Bezeichnung / Adresse',
    properties_table_units: 'Einheiten',
    properties_table_active: 'Aktive Meldungen',
    properties_table_actions: 'Aktionen',
    contractors_title: 'Fachpartner Netzwerk',
    contractors_subtitle: 'Verwalten Sie Ihre qualifizierten Handwerker-Kontakte und Service-Partner für effiziente Instandhaltung.',
    contractors_btn_add: 'Service Partner hinzufügen',
    contractors_filter_search: 'Suchen nach Name, Gewerk oder Kontakt...',
    contractors_stat_total: 'Partner',
    contractors_stat_active: 'Aktiv',
    contractors_trade_labels: 'Gewerke',
    contractors_btn_call: 'Anrufen',
    contractors_btn_email: 'Mailen',
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
    sidebar_role_owner: 'Owner',
    sidebar_role_team: 'Team',
    dashboard_welcome_title: 'Live Dashboard',
    dashboard_welcome_subtitle: 'Overview of system status and performance metrics for all your properties.',
    dashboard_metrics_total: 'Total Intake',
    dashboard_metrics_open: 'In Progress',
    dashboard_metrics_resolved: 'Resolved',
    dashboard_recent_activity: 'Recent Activity',
    dashboard_see_all: 'Full List',
    audit_title: 'System Audit',
    audit_subtitle: 'Full transparency over all backend activities, AI workflows, and data transfers.',
    audit_badge: 'Security & Compliance',
    audit_live_status: 'Live Status',
    audit_system_active: 'System Active',
    audit_header_timeline: 'Timeline',
    audit_header_type: 'Process Type',
    audit_header_actor: 'Actor',
    audit_header_details: 'Details & Execution',
    audit_identity: 'Identity',
    audit_reference: 'Reference',
    audit_export_title: 'Need Audit Export?',
    audit_export_subtitle: 'All system activities are stored immutably and can be exported as signed reports for compliance purposes.',
    audit_btn_export: 'Export to PDF',
    audit_btn_generating: 'GENERATING PDF...',
    tickets_title: 'All Tickets',
    tickets_subtitle: 'Central management of all tenant requests, repair orders, and damage reports.',
    tickets_btn_create: 'Create Ticket',
    tickets_stat_total: 'Total',
    tickets_stat_new: 'New',
    tickets_stat_active: 'Active',
    tickets_stat_done: 'Done',
    tickets_filter_search: 'Search reference, building, or tenant...',
    tickets_filter_all: 'Filter: All Status',
    tickets_table_ref: 'Reference',
    tickets_table_object: 'Object & Unit',
    tickets_table_priority: 'Priority',
    tickets_table_status: 'Status',
    tickets_table_details: 'Details',
    ticket_back: 'Back',
    ticket_live_view: 'Live View',
    ticket_unit: 'Unit',
    ticket_urgency: 'Urgency',
    ticket_category: 'Category',
    ticket_created_at: 'Created at',
    ticket_description: 'Description',
    ticket_tab_ai: 'Assistant & Analysis',
    ticket_tab_history: 'Version History',
    ticket_status_new: 'NEWLY CREATED',
    ticket_status_in_progress: 'IN PROGRESS',
    ticket_status_completed: 'COMPLETED',
    ticket_ai_intelligence: 'AI Intelligence',
    ticket_ai_reprocess: 'Analyze Again',
    ticket_ai_processing: 'Processing data...',
    ticket_ai_suggested_category: 'Suggested Category',
    ticket_ai_suggested_urgency: 'AI Urgency',
    ticket_ai_missing_info: 'Critical gaps in ticket',
    ticket_ai_suggested_contractors: 'Suggested Contractors',
    ticket_ai_google_maps: 'Search on Google Maps ➔',
    ticket_ai_email_draft: 'Email Draft',
    ticket_ai_email_purpose: 'For contractor engagement',
    ticket_ai_send_to_contractor: 'Send to Contractor',
    ticket_system_log: 'System Log',
    ticket_sidebar_tenant: 'Tenant Profile',
    ticket_sidebar_email: 'Email Address',
    ticket_sidebar_phone: 'Phone',
    ticket_sidebar_automation_title: 'Automation',
    ticket_sidebar_automation_desc: '"The AI automatically analyzes every ticket and suggests contractors and email drafts to minimize your processing time."',
    properties_title: 'Portfolio Overview',
    properties_subtitle: 'Manage your property portfolio, building information, and assigned units.',
    properties_btn_add: 'Add Building',
    properties_btn_import: 'Excel Import',
    properties_table_name: 'Name / Address',
    properties_table_units: 'Units',
    properties_table_active: 'Active Tickets',
    properties_table_actions: 'Actions',
    contractors_title: 'Contractor Network',
    contractors_subtitle: 'Manage your qualified contractor contacts and service partners for efficient maintenance.',
    contractors_btn_add: 'Add Service Partner',
    contractors_filter_search: 'Search by name, trade or contact...',
    contractors_stat_total: 'Partners',
    contractors_stat_active: 'Active',
    contractors_trade_labels: 'Trades',
    contractors_btn_call: 'Call',
    contractors_btn_email: 'Email',
  }
};
