export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export function calculateMatch(
  requiredSkills: string[],
  extractedSkills: string[],
): MatchResult {
  const extractedSet = new Set(extractedSkills);

  const missingSkills: string[] = [];

  const matchedSkills: string[] = [];

  for (const skill of requiredSkills) {
    if (extractedSet.has(skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const score =
    matchedSkills.length == 0
      ? 0
      : matchedSkills.length / requiredSkills.length;

  return { score, matchedSkills, missingSkills };
}
