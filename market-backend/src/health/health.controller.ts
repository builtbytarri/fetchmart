import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Liveness: is the process up and serving HTTP? Deliberately touches nothing
  // else. This is what the Docker HEALTHCHECK polls, so it must never reach the
  // database — a probe every 30s would keep a serverless Postgres awake 24/7.
  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Readiness: can the app actually serve traffic? Checks Postgres and Redis.
  // Returns 503 when either is down so external monitors can alert on the
  // status code alone. Not for Docker — poll this manually or at long intervals.
  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    const health = await this.healthService.check();
    if (health.status !== 'healthy') res.status(503);
    return health;
  }
}
