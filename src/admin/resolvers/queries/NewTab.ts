import { NewTab, NewTabs } from '../../../shared/types';

/**
 * This query retrieves new tabs available to the given SSO user
 *
 * @param parent
 * @param args
 * @param db
 */
export function getNewTabsForUser(parent, args, { token }): NewTab[] {
  // token comes from the context - see admin/context.ts
  // console.log(token);

  // TODO: when implementing SSO, decrypt token, validate signature and check
  // groups, which will contain new tab guid values.

  // we may want a separate helper function to parse the token and retrieve
  // the groups. we'll cross that bridge when we come to it.

  // until SSO is set up, just return all new tabs
  const userGroups = ['EN_US', 'DE_DE', 'EN_GB', 'EN_INTL'];

  return NewTabs.filter((newTab) => {
    return userGroups.includes(newTab.guid);
  });
}
