// Pocket Shared Data - see Confluence for details
export enum ProspectType {
  GLOBAL = 'GLOBAL',
  ORGANIC_TIMESPENT = 'ORGANIC_TIMESPENT',
  SYNDICATED = 'SYNDICATED',
  TOP_SAVED = 'TOP_SAVED',
  DOMAIN_ALLOWLIST = 'DOMAIN_ALLOWLIST',
}

export type ScheduledSurface = {
  name: string;
  guid: string;
  utcOffset: number;
  prospectTypes: ProspectType[];
};

export type ApprovedItemS3ImageUrl = {
  url: string;
};

export const ScheduledSurfaces: ScheduledSurface[] = [
  {
    name: 'New Tab (en-US)',
    guid: 'NEW_TAB_EN_US',
    utcOffset: -500,
    prospectTypes: [
      ProspectType.GLOBAL,
      ProspectType.ORGANIC_TIMESPENT,
      ProspectType.SYNDICATED,
    ],
  },
  {
    name: 'New Tab (de-DE)',
    guid: 'NEW_TAB_DE_DE',
    utcOffset: 100,
    prospectTypes: [
      ProspectType.GLOBAL,
      ProspectType.ORGANIC_TIMESPENT,
      ProspectType.DOMAIN_ALLOWLIST,
    ],
  },
  {
    name: 'New Tab (en-GB)',
    guid: 'NEW_TAB_EN_GB',
    utcOffset: 0,
    prospectTypes: [ProspectType.GLOBAL, ProspectType.ORGANIC_TIMESPENT],
  },
  {
    name: 'New Tab (en-INTL)',
    guid: 'NEW_TAB_EN_INTL',
    utcOffset: 530,
    prospectTypes: [ProspectType.GLOBAL, ProspectType.ORGANIC_TIMESPENT],
  },
  {
    name: 'Pocket Hits (en-US)',
    guid: 'POCKET_HITS_EN_US',
    utcOffset: -500,
    prospectTypes: [ProspectType.TOP_SAVED],
  },
  {
    name: 'Pocket Hits (de-DE)',
    guid: 'POCKET_HITS_DE_DE',
    utcOffset: 100,
    prospectTypes: [ProspectType.TOP_SAVED],
  },
];

// Useful, cut down versions of the above
export const scheduledSurfaceAllowedValues = ScheduledSurfaces.map(
  (surface) => {
    return surface.guid;
  }
);

export const getScheduledSurfaceByGuid = (
  guid: string
): ScheduledSurface | undefined => {
  return ScheduledSurfaces.find(
    (surface: ScheduledSurface) => surface.guid === guid
  );
};

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
}

// enum that maps the scheduled surface guid to a Mozilla access group
export enum ScheduledSurfaceGuidToMozillaAccessGroup {
  NEW_TAB_EN_US = MozillaAccessGroup.NEW_TAB_CURATOR_ENUS,
  NEW_TAB_EN_GB = MozillaAccessGroup.NEW_TAB_CURATOR_ENGB,
  NEW_TAB_EN_INTL = MozillaAccessGroup.NEW_TAB_CURATOR_ENINTL,
  NEW_TAB_DE_DE = MozillaAccessGroup.NEW_TAB_CURATOR_DEDE,
  POCKET_HITS_EN_US = MozillaAccessGroup.POCKET_HITS_CURATOR_ENUS,
  POCKET_HITS_DE_DE = MozillaAccessGroup.POCKET_HITS_CURATOR_DEDE,
}

export const AccessGroupToScheduledSurfaceMap: {
  [key in MozillaAccessGroup]?: ScheduledSurface;
} = {
  [MozillaAccessGroup.NEW_TAB_CURATOR_ENUS]:
    getScheduledSurfaceByGuid('NEW_TAB_EN_US'),
  [MozillaAccessGroup.NEW_TAB_CURATOR_DEDE]:
    getScheduledSurfaceByGuid('NEW_TAB_DE_DE'),
  [MozillaAccessGroup.NEW_TAB_CURATOR_ENGB]:
    getScheduledSurfaceByGuid('NEW_TAB_EN_GB'),
  [MozillaAccessGroup.NEW_TAB_CURATOR_ENINTL]:
    getScheduledSurfaceByGuid('NEW_TAB_EN_INTL'),
  [MozillaAccessGroup.NEW_TAB_CURATOR_ENGB]:
    getScheduledSurfaceByGuid('NEW_TAB_EN_GB'),
  [MozillaAccessGroup.NEW_TAB_CURATOR_ENINTL]:
    getScheduledSurfaceByGuid('NEW_TAB_EN_INTL'),
  [MozillaAccessGroup.POCKET_HITS_CURATOR_DEDE]: getScheduledSurfaceByGuid(
    'POCKET_HITS_CURATOR_DEDE'
  ),
  [MozillaAccessGroup.POCKET_HITS_CURATOR_ENUS]: getScheduledSurfaceByGuid(
    'POCKET_HITS_CURATOR_ENUS'
  ),
};

export enum Topics {
  BUSINESS = 'BUSINESS',
  CAREER = 'CAREER',
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

export const ACCESS_DENIED_ERROR =
  'You do not have access to perform this action.';
