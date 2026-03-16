import { Module, forwardRef } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { AuthModule } from '../auth';
import { ProductsModule } from '../products';

@Module({
  imports: [AuthModule, forwardRef(() => ProductsModule)],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
