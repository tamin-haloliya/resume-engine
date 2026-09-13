const UNIT_MULTIPLIERS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
};

export function expiryInSeconds(expiresIn: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(expiresIn.trim().toLowerCase());
  if (!match) {
    return 7 * 24 * 60 * 60;
  }
  const value = parseInt(match[1], 10);
  const multiplier = UNIT_MULTIPLIERS[match[2]] ?? 24 * 60 * 60;
  return value * multiplier;
}
