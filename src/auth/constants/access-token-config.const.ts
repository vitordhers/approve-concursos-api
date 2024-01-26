import { ConfigService } from '@nestjs/config';

export const AccessTokenStrategyConfigFactory = {
  provide: 'ACCESS_TOKEN_STRATEGY_CONFIG',
  useFactory: (configService: ConfigService) => {
    return {
      secret: configService.get<string>('ACCESS_TOKEN_SECRET_PRIVATE'),
    };
  },
  inject: [ConfigService],
};
