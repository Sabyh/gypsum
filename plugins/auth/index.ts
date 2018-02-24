import { Logger } from '../../misc/logger';
import { initAuthentication } from './authentication';
import { IAuthenticationConfig, IAuthenticationConfigOptions, IEmailTransporter, defaultConfig } from './config';
import { initAuthorization } from './Authorization';

export { IAuthenticationConfig, IEmailTransporter } from './config';


export function AuthPlugin(authConfig: IAuthenticationConfig, transporterOptions?: IEmailTransporter) {
  Logger.Info('Initializing Authentication Layer...');
  let AuthConfig: IAuthenticationConfigOptions = <any>{}

  if (authConfig)
    Object.assign(AuthConfig, defaultConfig, authConfig);
  else
    Object.assign(this.authConfig, defaultConfig);


  initAuthentication(AuthConfig, transporterOptions);


  if (AuthConfig.authorization)
    initAuthorization(AuthConfig);
}