// Pocket Shared Data - see Confluence for details
export enum ProspectType {
  GLOBAL = 'GLOBAL',
  ORGANIC_TIMESPENT = 'ORGANIC_TIMESPENT',
  SYNDICATED = 'SYNDICATED',
}

export type NewTab = {
  name: string;
  guid: string;
  utcOffset: number;
  prospectTypes: ProspectType[];
};

export type ApprovedItemS3ImageUrl = {
  url: string;
};

export const NewTabs: NewTab[] = [
  {
    name: 'en-US',
    guid: 'EN_US',
    utcOffset: -500,
    prospectTypes: [
      ProspectType.GLOBAL,
      ProspectType.ORGANIC_TIMESPENT,
      ProspectType.SYNDICATED,
    ],
  },
  {
    name: 'de-DE',
    guid: 'DE_DE',
    utcOffset: 100,
    prospectTypes: [ProspectType.GLOBAL, ProspectType.ORGANIC_TIMESPENT],
  },
  {
    name: 'en-GB',
    guid: 'EN_GB',
    utcOffset: 0,
    prospectTypes: [ProspectType.GLOBAL, ProspectType.ORGANIC_TIMESPENT],
  },
  {
    name: 'en-INTL',
    guid: 'EN_INTL',
    utcOffset: 530,
    prospectTypes: [ProspectType.GLOBAL, ProspectType.ORGANIC_TIMESPENT],
  },
];

// Useful, cut down versions of the above
export const newTabAllowedValues = NewTabs.map((newTab) => {
  return newTab.guid;
});

export const getNewTabByGuid = (guid: string): NewTab | undefined => {
  return NewTabs.find((newTab: NewTab) => newTab.guid === guid);
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

export const AccessGroupToScheduledSurfaceMap: {
  [key in MozillaAccessGroup]?: NewTab;
} = {
  [MozillaAccessGroup.NEW_TAB_CURATOR_ENUS]: getNewTabByGuid('EN_US'),
  [MozillaAccessGroup.NEW_TAB_CURATOR_DEDE]: getNewTabByGuid('DE_DE'),
  [MozillaAccessGroup.NEW_TAB_CURATOR_ENGB]: getNewTabByGuid('EN_GB'),
  [MozillaAccessGroup.NEW_TAB_CURATOR_ENINTL]: getNewTabByGuid('EN_INTL'),
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
