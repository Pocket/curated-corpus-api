// Pocket Shared Data - see Confluence for details
export enum ProspectType {
  GLOBAL = 'GLOBAL',
  TIMESPENT = 'ORGANIC_TIMESPENT',
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
    utcOffset: -4000,
    prospectTypes: [
      ProspectType.GLOBAL,
      ProspectType.TIMESPENT,
      ProspectType.SYNDICATED,
    ],
  },
  {
    name: 'de-DE',
    guid: 'DE_DE',
    utcOffset: 1000,
    prospectTypes: [ProspectType.GLOBAL],
  },
];

// Useful, cut down versions of the above
export const newTabAllowedValues = NewTabs.map((newTab) => {
  return newTab.guid;
});

export const getNewTabByGuid = (guid: string): NewTab | undefined => {
  return NewTabs.find((newTab: NewTab) => newTab.guid === guid);
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
