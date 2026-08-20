import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth';
import { GetUploadUrlDto } from './dto';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Hand the caller a short-lived signed upload so the device can send image
   * bytes straight to the storage provider without proxying them through us.
   */
  @Post('upload-url')
  async getUploadUrl(@Body() dto: GetUploadUrlDto) {
    return this.storageService.getUploadUrl(dto.folder, dto.filename, dto.contentType);
  }
}
