export class RankedJobsDto {
  jobId!: string;

  jobTitle!: string;

  score!: number;

  matchedSkills!: string[];

  missingSkills!: string[];
}
