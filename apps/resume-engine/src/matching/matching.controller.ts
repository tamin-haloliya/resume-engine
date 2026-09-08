import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('match')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get(':resumeId')
  getRankedJobs(
    @Param('resumeId') resumeId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.matchingService.rankJobForResume(resumeId, limit);
  }

  @Get('top/:resumeId')
  getTopMatch(@Param('resumeId') resumeId: string) {
    return this.matchingService.getTopMatched(resumeId);
  }
}
