// Pocket Shared Data - see Confluence for details
// https://getpocket.atlassian.net/wiki/spaces/PE/pages/2584150049/Pocket+Shared+Data
export enum ProspectType {
  GLOBAL = 'GLOBAL',
  ORGANIC_TIMESPENT = 'ORGANIC_TIMESPENT',
  SYNDICATED_NEW = 'SYNDICATED_NEW',
  SYNDICATED_RERUN = 'SYNDICATED_RERUN',
  TOP_SAVED = 'TOP_SAVED',
  DOMAIN_ALLOWLIST = 'DOMAIN_ALLOWLIST',
  COUNTS_LOGISTIC_APPROVAL = 'COUNTS_LOGISTIC_APPROVAL',
  HYBRID_LOGISTIC_APPROVAL = 'HYBRID_LOGISTIC_APPROVAL',
  APPROVED = 'APPROVED',
  TIMESPENT_LOGISTIC_APPROVAL = 'TIMESPENT_LOGISTIC_APPROVAL',
}

export enum MozillaAccessGroup {
  READONLY = 'team_pocket', // Read only access to all curation tools
  COLLECTION_CURATOR_FULL = 'mozilliansorg_pocket_collection_curator_full', // Access to full collection tool
  SCHEDULED_SURFACE_CURATOR_FULL = 'mozilliansorg_pocket_scheduled_surface_curator_full', // Access to full corpus tool, implies they have access to all scheduled surfaces.
  NEW_TAB_CURATOR_ENUS = 'mozilliansorg_pocket_new_tab_curator_enus', // Access to en-us new tab in the corpus tool.
  NEW_TAB_CURATOR_DEDE = 'mozilliansorg_pocket_new_tab_curator_dede', // Access to de-de new tab in corpus tool.
  NEW_TAB_CURATOR_ENGB = 'mozilliansorg_pocket_new_tab_curator_engb', // Access to en-gb new tab in corpus tool.
  NEW_TAB_CURATOR_ENINTL = 'mozilliansorg_pocket_new_tab_curator_enintl', // Access to en-intl new tab in corpus tool.
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
      ProspectType.TOP_SAVED,
      ProspectType.GLOBAL,
      ProspectType.ORGANIC_TIMESPENT,
      ProspectType.SYNDICATED_NEW,
      ProspectType.SYNDICATED_RERUN,
      ProspectType.COUNTS_LOGISTIC_APPROVAL,
      ProspectType.HYBRID_LOGISTIC_APPROVAL,
      ProspectType.APPROVED,
      ProspectType.TIMESPENT_LOGISTIC_APPROVAL,
    ],
    accessGroup: MozillaAccessGroup.NEW_TAB_CURATOR_ENUS,
  },
  {
    name: 'New Tab (de-DE)',
    guid: 'NEW_TAB_DE_DE',
    ianaTimezone: 'Europe/Berlin',
    prospectTypes: [
      ProspectType.GLOBAL,
      ProspectType.ORGANIC_TIMESPENT,
      ProspectType.DOMAIN_ALLOWLIST,
    ],
    accessGroup: MozillaAccessGroup.NEW_TAB_CURATOR_DEDE,
  },
  {
    name: 'New Tab (en-GB)',
    guid: 'NEW_TAB_EN_GB',
    ianaTimezone: 'Europe/London',
    prospectTypes: [
      ProspectType.GLOBAL,
      ProspectType.ORGANIC_TIMESPENT,
      ProspectType.APPROVED,
    ],
    accessGroup: MozillaAccessGroup.NEW_TAB_CURATOR_ENGB,
  },
  {
    name: 'New Tab (en-INTL)',
    guid: 'NEW_TAB_EN_INTL',
    ianaTimezone: 'Asia/Kolkata',
    prospectTypes: [
      ProspectType.GLOBAL,
      ProspectType.ORGANIC_TIMESPENT,
      ProspectType.APPROVED,
    ],
    accessGroup: MozillaAccessGroup.NEW_TAB_CURATOR_ENINTL,
  },
  {
    name: 'Pocket Hits (en-US)',
    guid: 'POCKET_HITS_EN_US',
    ianaTimezone: 'America/New_York',
    prospectTypes: [
      ProspectType.TOP_SAVED,
      ProspectType.GLOBAL,
      ProspectType.ORGANIC_TIMESPENT,
      ProspectType.COUNTS_LOGISTIC_APPROVAL,
      ProspectType.HYBRID_LOGISTIC_APPROVAL,
    ],
    accessGroup: MozillaAccessGroup.POCKET_HITS_CURATOR_ENUS,
  },
  {
    name: 'Pocket Hits (de-DE)',
    guid: 'POCKET_HITS_DE_DE',
    ianaTimezone: 'Europe/Berlin',
    prospectTypes: [
      ProspectType.TOP_SAVED,
      ProspectType.GLOBAL,
      ProspectType.ORGANIC_TIMESPENT,
      ProspectType.DOMAIN_ALLOWLIST,
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

export const ACCESS_DENIED_ERROR =
  'You do not have access to perform this action.';
