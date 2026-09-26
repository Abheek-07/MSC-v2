/**
 * Canonical shape of a team member as consumed by admin/scanner surfaces.
 *
 * `registrations.team_data.members` is stored verbatim in camelCase
 * (`fullName`, `regNum`, ...) by the registration form. Rather than migrating
 * stored data, every server boundary normalizes to this shape so the admin
 * roster, the QR turnstile and the offline cache all agree on field names.
 */
export interface TeamMember {
  name: string;
  email: string;
  reg_number: string;
  branch: string;
  year: string;
  checked_in: boolean;
  /** True for the team lead, derived from `team_data.team_lead_index`. */
  is_lead: boolean;
}

type RawMember = Record<string, unknown>;

function str(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

/**
 * Normalizes `team_data.members` into {@link TeamMember} objects.
 *
 * Accepts both the camelCase keys written by the registration form and the
 * snake_case keys used by the admin UI, so historical rows and offline cache
 * entries both render correctly.
 *
 * @param raw The value of `team_data.members` (unknown shape).
 * @param leadIndex Index of the team lead within the array. Defaults to 0.
 */
export function normalizeTeamMembers(raw: unknown, leadIndex = 0): TeamMember[] {
  if (!Array.isArray(raw)) return [];

  const members: TeamMember[] = [];

  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    const m = entry as RawMember;

    const member: TeamMember = {
      name: str(m.fullName) || str(m.name),
      email: str(m.email),
      reg_number: str(m.regNum) || str(m.reg_number) || str(m.registration_number),
      branch: str(m.branch),
      year: str(m.year),
      checked_in: Boolean(m.checked_in),
      is_lead: index === leadIndex,
    };

    // Drop empty rows so a malformed entry cannot render a blank list item.
    if (member.name || member.email || member.reg_number) {
      members.push(member);
    }
  });

  return members;
}
