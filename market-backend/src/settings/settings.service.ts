import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database';
import { PlatformSettings } from '@prisma/client';
import { UpdateSettingsDto } from './dto';

/**
 * Owns the single PlatformSettings row. All pricing / commission parameters
 * live here so they can be tuned from the admin panel without a redeploy.
 */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the settings singleton, lazily creating it with defaults. */
  async getSettings(): Promise<PlatformSettings> {
    const existing = await this.prisma.platformSettings.findFirst();
    if (existing) return existing;
    return this.prisma.platformSettings.create({ data: {} });
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<PlatformSettings> {
    const settings = await this.getSettings();
    return this.prisma.platformSettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }
}
