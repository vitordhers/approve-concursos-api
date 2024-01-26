import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { QuestionsModule } from './questions/questions.module';
import { BoardsModule } from './boards/boards.module';
import { ExamsModule } from './exams/exams.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { DbModule } from './db/db.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TokensModule } from './tokens/tokens.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseTransformInterceptor } from './shared/interceptors/response-transformer-interceptor.service';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { SubjectsModule } from './subjects/subjects.module';
import { EmailsModule } from './email/email.module';
import { RolesGuard } from './auth/guards/roles.guard';
import { AuthGuard } from './auth/guards/auth.guard';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../', '../', 'client'),
      exclude: ['/api*'],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TokensModule,
    AuthModule,
    UsersModule,
    QuestionsModule,
    BoardsModule,
    ExamsModule,
    InstitutionsModule,
    SubjectsModule,
    DbModule,
    UploadModule,
    EmailsModule,
    PaymentsModule,
    WebhooksModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
