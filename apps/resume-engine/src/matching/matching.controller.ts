import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('match')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get(':resumeId')
  getRankedJobs(
    @Param('resumeId') resumeId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.matchingService.rankJobForResume(resumeId, page, limit);
  }
}
