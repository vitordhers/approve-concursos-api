import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { QuestionsModule } from './questions/questions.module';
import { BoardsModule } from './boards/boards.module';
import { ExamsModule } from './exams/exams.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { DbModule } from './db/db.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TokensModule } from './tokens/tokens.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseTransformInterceptor } from './shared/interceptors/response-transformer-interceptor.service';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SubjectsModule } from './subjects/subjects.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..'),
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule {}
