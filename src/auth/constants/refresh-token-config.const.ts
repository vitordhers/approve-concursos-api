import { ConfigService } from '@nestjs/config';

export const RefreshTokenStrategyConfigFactory = {
  provide: 'REFRESH_TOKEN_STRATEGY_CONFIG',
  useFactory: (configService: ConfigService) => {
    return {
      secret: configService.get<string>('REFRESH_TOKEN_SECRET_PRIVATE'),
    };
  },
  inject: [ConfigService],
};
