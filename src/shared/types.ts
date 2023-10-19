// Pocket Shared Data - see Confluence for details
// https://getpocket.atlassian.net/wiki/spaces/PE/pages/2584150049/Pocket+Shared+Data
export enum ProspectType {
  TIMESPENT = 'TIMESPENT',
  COUNTS = 'COUNTS',
  SYNDICATED_NEW = 'SYNDICATED_NEW',
  SYNDICATED_RERUN = 'SYNDICATED_RERUN',
  DOMAIN_ALLOWLIST = 'DOMAIN_ALLOWLIST',
  TOP_SAVED = 'TOP_SAVED',
  RECOMMENDED = 'RECOMMENDED',
  COUNTS_MODELED = 'COUNTS_MODELED',
  TIMESPENT_MODELED = 'TIMESPENT_MODELED',
  TITLE_URL_MODELED = 'TITLE_URL_MODELED',
  DISMISSED = 'DISMISSED',
  RSS_LOGISTIC = 'RSS_LOGISTIC',
}

export enum MozillaAccessGroup {
  READONLY = 'team_pocket', // Read only access to all curation tools
  COLLECTION_CURATOR_FULL = 'mozilliansorg_pocket_collection_curator_full', // Access to full collection tool
  SCHEDULED_SURFACE_CURATOR_FULL = 'mozilliansorg_pocket_scheduled_surface_curator_full', // Access to full corpus tool, implies they have access to all scheduled surfaces.
  NEW_TAB_CURATOR_ENUS = 'mozilliansorg_pocket_new_tab_curator_enus', // Access to en-US new tab in the corpus tool.
  NEW_TAB_CURATOR_DEDE = 'mozilliansorg_pocket_new_tab_curator_dede', // Access to de-DE new tab in corpus tool.
  NEW_TAB_CURATOR_ENGB = 'mozilliansorg_pocket_new_tab_curator_engb', // Access to en-GB new tab in corpus tool.
  NEW_TAB_CURATOR_FRFR = 'mozilliansorg_pocket_new_tab_curator_frfr', // Access to fr-FR new tab in corpus tool.
  NEW_TAB_CURATOR_ITIT = 'mozilliansorg_pocket_new_tab_curator_itit', // Access to it-IT new tab in corpus tool.
  NEW_TAB_CURATOR_ESES = 'mozilliansorg_pocket_new_tab_curator_eses', // Access to es-ES new tab in corpus tool.
  NEW_TAB_CURATOR_ENINTL = 'mozilliansorg_pocket_new_tab_curator_enintl', // Access to en-INTL new tab in corpus tool.
  POCKET_HITS_CURATOR_ENUS = 'mozilliansorg_pocket_pocket_hits_curator_enus', // Access to en us Pocket Hits in the corpus tool.
  POCKET_HITS_CURATOR_DEDE = 'mozilliansorg_pocket_pocket_hits_curator_dede', // Access to de de Pocket Hits in the corpus tool.
  CURATOR_SANDBOX = 'mozilliansorg_pocket_curator_sandbox', // Access to sandbox test surface in the corpus tool.
}

export type ScheduledSurface = {
  name: string;
  guid: string;
  ianaTimezone: string;
  prospectTypes: ProspectType[];
  accessGroup: string;
};

export const ScheduledSurfaces: ScheduledSurface[] = [
  {
    name: 'New Tab (en-US)',
    guid: 'NEW_TAB_EN_US',
    ianaTimezone: 'America/New_York',
    prospectTypes: [
      ProspectType.COUNTS,
      ProspectType.TIMESPENT,
      ProspectType.RECOMMENDED,
      ProspectType.TOP_SAVED,
      ProspectType.DOMAIN_ALLOWLIST,
      ProspectType.DISMISSED,
      ProspectType.SYNDICATED_RERUN,
      ProspectType.SYNDICATED_NEW,
      ProspectType.COUNTS_MODELED,
      ProspectType.TIMESPENT_MODELED,
      ProspectType.TITLE_URL_MODELED,
      ProspectType.RSS_LOGISTIC,
    ],
    accessGroup: MozillaAccessGroup.NEW_TAB_CURATOR_ENUS,
  },
  {
    name: 'New Tab (de-DE)',
    guid: 'NEW_TAB_DE_DE',
    ianaTimezone: 'Europe/Berlin',
    prospectTypes: [
      ProspectType.COUNTS,
      ProspectType.TIMESPENT,
      ProspectType.DOMAIN_ALLOWLIST,
      ProspectType.DISMISSED,
      ProspectType.TITLE_URL_MODELED,
    ],
    accessGroup: MozillaAccessGroup.NEW_TAB_CURATOR_DEDE,
  },
  {
    name: 'New Tab (en-GB)',
    guid: 'NEW_TAB_EN_GB',
    ianaTimezone: 'Europe/London',
    prospectTypes: [
      ProspectType.COUNTS,
      ProspectType.TIMESPENT,
      ProspectType.RECOMMENDED,
      ProspectType.DISMISSED,
    ],
    accessGroup: MozillaAccessGroup.NEW_TAB_CURATOR_ENGB,
  },
  {
    name: 'New Tab (fr-FR)',
    guid: 'NEW_TAB_FR_FR',
    ianaTimezone: 'Europe/Paris',
    prospectTypes: [ProspectType.DOMAIN_ALLOWLIST],
    accessGroup: MozillaAccessGroup.NEW_TAB_CURATOR_FRFR,
  },
  {
    name: 'New Tab (it-IT)',
    guid: 'NEW_TAB_IT_IT',
    ianaTimezone: 'Europe/Rome',
    prospectTypes: [ProspectType.DOMAIN_ALLOWLIST],
    accessGroup: MozillaAccessGroup.NEW_TAB_CURATOR_ITIT,
  },
  {
    name: 'New Tab (es-ES)',
    guid: 'NEW_TAB_ES_ES',
    ianaTimezone: 'Europe/Madrid',
    prospectTypes: [ProspectType.DOMAIN_ALLOWLIST],
    accessGroup: MozillaAccessGroup.NEW_TAB_CURATOR_ESES,
  },
  {
    name: 'New Tab (en-INTL)',
    guid: 'NEW_TAB_EN_INTL',
    ianaTimezone: 'Asia/Kolkata',
    prospectTypes: [
      ProspectType.COUNTS,
      ProspectType.TIMESPENT,
      ProspectType.RECOMMENDED,
      ProspectType.DISMISSED,
    ],
    accessGroup: MozillaAccessGroup.NEW_TAB_CURATOR_ENINTL,
  },
  {
    name: 'Pocket Hits (en-US)',
    guid: 'POCKET_HITS_EN_US',
    ianaTimezone: 'America/New_York',
    prospectTypes: [
      ProspectType.COUNTS,
      ProspectType.TOP_SAVED,
      ProspectType.TIMESPENT,
      ProspectType.DISMISSED,
      ProspectType.COUNTS_MODELED,
      ProspectType.TITLE_URL_MODELED,
      ProspectType.RSS_LOGISTIC,
    ],
    accessGroup: MozillaAccessGroup.POCKET_HITS_CURATOR_ENUS,
  },
  {
    name: 'Pocket Hits (de-DE)',
    guid: 'POCKET_HITS_DE_DE',
    ianaTimezone: 'Europe/Berlin',
    prospectTypes: [
      ProspectType.COUNTS,
      ProspectType.TIMESPENT,
      ProspectType.TOP_SAVED,
      ProspectType.DOMAIN_ALLOWLIST,
      ProspectType.TITLE_URL_MODELED,
    ],
    accessGroup: MozillaAccessGroup.POCKET_HITS_CURATOR_DEDE,
  },

  {
    name: 'Sandbox',
    guid: 'SANDBOX',
    ianaTimezone: 'America/New_York',
    prospectTypes: [],
    accessGroup: MozillaAccessGroup.CURATOR_SANDBOX,
  },
];

export enum Topics {
  BUSINESS = 'BUSINESS',
  CAREER = 'CAREER',
  CORONAVIRUS = 'CORONAVIRUS',
  EDUCATION = 'EDUCATION',
  ENTERTAINMENT = 'ENTERTAINMENT',
  FOOD = 'FOOD',
  GAMING = 'GAMING',
  HEALTH_FITNESS = 'HEALTH_FITNESS',
  PARENTING = 'PARENTING',
  PERSONAL_FINANCE = 'PERSONAL_FINANCE',
  POLITICS = 'POLITICS',
  SCIENCE = 'SCIENCE',
  SELF_IMPROVEMENT = 'SELF_IMPROVEMENT',
  SPORTS = 'SPORTS',
  TECHNOLOGY = 'TECHNOLOGY',
  TRAVEL = 'TRAVEL',
}

export enum RejectionReason {
  PAYWALL = 'PAYWALL',
  POLITICAL_OPINION = 'POLITICAL_OPINION',
  OFFENSIVE_MATERIAL = 'OFFENSIVE_MATERIAL',
  TIME_SENSITIVE = 'TIME_SENSITIVE',
  MISINFORMATION = 'MISINFORMATION',
  OTHER = 'OTHER',
}

export enum CorpusItemSource {
  PROSPECT = 'PROSPECT', //  originated as a prospect in the curation admin tool
  MANUAL = 'MANUAL', // manually entered through the curation admin tool
  BACKFILL = 'BACKFILL', // imported from the legacy database
}
// End Pocket shared data

export type ApprovedItemS3ImageUrl = {
  url: string;
};

export type OpenGraphFields = {
  description: string;
};
export const ACCESS_DENIED_ERROR =
  'You do not have access to perform this action.';
