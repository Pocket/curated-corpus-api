import {
  AccessGroupToScheduledSurfaceMap,
  MozillaAccessGroup,
  NewTab,
  NewTabs,
} from '../../../shared/types';

/**
 * This query retrieves new tabs available to the given SSO user
 *
 * @param parent
 * @param args
 * @param db
 */
export function getNewTabsForUser(
  parent,
  args,
  { authenticatedUser }
): NewTab[] {
  let scheduledSurfaces: NewTab[] = [];

  // Return all scheduled surfaces for users with full access to the tool
  // and read-only users (otherwise the latter won't see anything???)
  if (
    authenticatedUser.groups.includes(
      MozillaAccessGroup.SCHEDULED_SURFACE_CURATOR_FULL
    ) ||
    authenticatedUser.groups.includes(MozillaAccessGroup.READONLY)
  ) {
    // Somehow it doesn't seem right to be returning the entire shared data array
    // without assigning it to a variable first
    scheduledSurfaces = NewTabs;
    // Return early - there is no need for extra access checks.
    return scheduledSurfaces;
  }

  // Iterate through groups that give permission to one surface only
  // and add these to the return value
  authenticatedUser.groups.forEach((group: MozillaAccessGroup) => {
    if (group in AccessGroupToScheduledSurfaceMap) {
      scheduledSurfaces.push(AccessGroupToScheduledSurfaceMap[group]!);
    }
  });

  return scheduledSurfaces;
}
