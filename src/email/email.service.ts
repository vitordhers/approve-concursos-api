import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { TokenService } from 'src/tokens/tokens.service';
import { User } from 'src/users/entities/user.entity';
import { Auth } from 'googleapis';
import { inspect } from 'util';

@Injectable()
export class EmailsService {
  private logger = new Logger('EmailsService');
  private senderMail = this.configService.get<string>('MAIL_ACCOUNT');
  private appUrl = this.configService.get<string>('APP_URL');

  private oauth2Client = new Auth.OAuth2Client(
    this.configService.get<string>('MAIL_OAUTH_CLIENT_ID'),
    this.configService.get<string>('MAIL_OAUTH_SECRET'),
    'https://developers.google.com/oauthplayground',
  );

  constructor(
    private readonly configService: ConfigService,
    private tokensService: TokenService,
  ) {
    this.oauth2Client.setCredentials({
      refresh_token: this.configService.get<string>('MAIL_OAUTH_REFRESH_TOKEN'),
    });
  }

  private async createTransporter() {
    try {
      const accessToken = await this.getOAuthAccessToken();
      return createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: this.senderMail,
          accessToken,
          clientId: this.configService.get<string>('MAIL_OAUTH_CLIENT_ID'),
          clientSecret: this.configService.get<string>('MAIL_OAUTH_SECRET'),
          refreshToken: this.configService.get<string>(
            'MAIL_OAUTH_REFRESH_TOKEN',
          ),
        },
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  async sendUserValidationEmail(user: User) {
    const { email } = user;
    const transporter = await this.createTransporter();
    transporter.verify((error) => {
      if (error) {
        console.log(error);
      }
    });
    const html = this.nonValidatedUserHtmlMessage(user);

    const result = await transporter.sendMail({
      from: `Approve Concursos <${this.senderMail}>`,
      to: email,
      subject: '😄 Confirme seu cadastro',
      html,
    });

    this.logger.log(
      `Email sent: ${inspect(
        { envevolpe: result.envelope, accepted: result.accepted },
        { depth: null },
      )}`,
    );

    return result.accepted.length === 1;
  }

  async sendPasswordRecoverToken(user: User) {
    const { email } = user;
    const transporter = await this.createTransporter();
    transporter.verify((error) => {
      if (error) {
        console.log(error);
      }
    });

    const html = this.recoverPasswordHtmlMesage(user);

    const result = await transporter.sendMail({
      from: `Approve Concursos <${this.senderMail}>`,
      to: email,
      subject: '🔒 Redefina sua senha',
      html,
    });

    this.logger.log(
      `Email sent: ${inspect(
        { envevolpe: result.envelope, accepted: result.accepted },
        { depth: null },
      )}`,
    );

    return result.accepted.length === 1;
  }

  private async getOAuthAccessToken(): Promise<string> {
    return await new Promise((resolve, reject) => {
      this.oauth2Client.getAccessToken((err, token) => {
        if (err) {
          this.logger.error(err);
          reject('Failed to create access token');
        }
        resolve(token);
      });
    });
  }

  private nonValidatedUserHtmlMessage(user: User): string {
    const { name, email } = user;

    const confirmationToken =
      this.tokensService.createMailConfirmationToken(email);

    const html = `
    Prezado ${name},
    <br>
    Para confirmar seu cadastro na plataforma Approve Concursos, favor clicar no botão abaixo:
    <br>
    <br>
    <button style="color: white; padding: .75rem 2.5rem; border: none; cursor: pointer; border-radius: 50px; font-weight: bold; font-size: 1.2rem; background-color: #3b82f6">
      <a href="${this.appUrl}/home?verificar=${confirmationToken}" target="_blank" style="text-decoration: none; color: white">
        Verificar minha conta
      </a>
    </button>
    <br>
    <p>
      O link acima é válido para os próximos 7 dias. Caso não tenha confirmado a tempo, favor acessar
    <a href="${this.appUrl}/home?reenviarConfirmacao=${email}" target="_blank">este link</a> para reenviar um novo pedido de confirmação do e-mail.
    </p>
    <p>
     Agradecemos o cadastro, para maiores dúvidas, favor entrar em contato através do e-mail ${this.senderMail}
    </p>`;
    return html;
  }

  private recoverPasswordHtmlMesage(user: User): string {
    const { name, email } = user;

    const confirmationToken =
      this.tokensService.createPasswordRecoveryToken(email);

    const html = `
    Prezado ${name},
    <br>
    Para redefinir sua senha na plataforma Approve Concursos, favor clicar no botão abaixo:
    <br>
    <br>
    <button style="color: white; padding: .75rem 2.5rem; border: none; cursor: pointer; border-radius: 50px; font-weight: bold; font-size: 1.2rem; background-color: #3b82f6">
      <a href="${this.appUrl}/home?redefinirSenha=${confirmationToken}" target="_blank" style="text-decoration: none; color: white">
        Redefinir minha senha
      </a>
    </button>
    <br>
    <p>
      O link acima é válido para os próximos 10 minutos. Caso não tenha redefinido sua senha a tempo, favor acessar
    <a href="${this.appUrl}/home?recuperarSenha=${email}" target="_blank">este link</a> para reenviar um novo pedido de redefinição de senha.
    </p>
    <p>
     Para maiores dúvidas, favor entrar em contato através do e-mail ${this.senderMail}
    </p>`;
    return html;
  }
}
