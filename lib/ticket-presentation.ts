/** Public-safe projection for a team ticket page. Never put attendee contact
 * information, check-in state, registration data, or QR bearer values here. */
export interface TeamOverviewMember {
  id: string;
  fullName: string;
  role: string;
}

export function createSafeTeamOverview(registrationId: string, members: unknown): TeamOverviewMember[] {
  if (!Array.isArray(members)) return [];
  return members.map((value, index) => {
    const member = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
      id: typeof member.id === 'string' ? member.id : `${registrationId}-m-${index}`,
      fullName: typeof member.fullName === 'string' && member.fullName.trim()
        ? member.fullName.trim()
        : typeof member.name === 'string' && member.name.trim() ? member.name.trim() : 'Team member',
      role: typeof member.role === 'string' && member.role.trim()
        ? member.role.trim() : index === 0 ? 'Lead' : 'Member',
    };
  });
}
