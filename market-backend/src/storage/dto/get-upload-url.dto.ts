import { IsIn, IsString, MaxLength } from 'class-validator';
import { ALLOWED_IMAGE_TYPES } from '../storage.interface';

export class GetUploadUrlDto {
  /** Logical bucket folder — validated again in the service. */
  @IsString()
  @IsIn(['products', 'stores', 'avatars'])
  folder: string;

  /** Original filename, kept only for logging; the stored key is generated. */
  @IsString()
  @MaxLength(255)
  filename: string;

  @IsString()
  @IsIn(ALLOWED_IMAGE_TYPES as unknown as string[])
  contentType: string;
}
