import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth';

class GetUploadUrlDto {
  folder: string;
  filename: string;
  contentType: string;
}

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-url')
  async getUploadUrl(@Body() dto: GetUploadUrlDto) {
    return this.storageService.getUploadUrl(dto.folder, dto.filename, dto.contentType);
  }
}
