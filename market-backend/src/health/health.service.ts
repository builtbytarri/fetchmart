import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database';
import { RedisService } from '../redis';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    app: {
      status: 'up' | 'down';
    };
    database: {
      status: 'up' | 'down';
    };
    redis: {
      status: 'up' | 'down';
    };
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async check(): Promise<HealthStatus> {
    const [databaseHealthy, redisHealthy] = await Promise.all([
      this.prismaService.isHealthy(),
      this.redisService.isHealthy(),
    ]);

    const allHealthy = databaseHealthy && redisHealthy;

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        app: {
          status: 'up',
        },
        database: {
          status: databaseHealthy ? 'up' : 'down',
        },
        redis: {
          status: redisHealthy ? 'up' : 'down',
        },
      },
    };
  }
}
