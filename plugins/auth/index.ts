import { Logger } from '../../misc/logger';
import { initAuthentication } from './authentication';
import { IAuthenticationConfig, IAuthenticationConfigOptions, IEmailTransporter, defaultConfig } from './config';
import { initAuthorization } from './Authorization';
import { Model } from '../../models';

export { IAuthenticationConfig, IEmailTransporter } from './config';


export function AuthPlugin(authConfig: IAuthenticationConfig, transporterOptions?: IEmailTransporter): typeof Model[] {
  Logger.Info('Initializing Authentication Layer...');
  let AuthConfig: IAuthenticationConfigOptions = <any>{}

  if (authConfig)
    Object.assign(AuthConfig, defaultConfig, authConfig);
  else
    Object.assign(this.authConfig, defaultConfig);

  let models: typeof Model[] = [];


  let authLayer: typeof Model = initAuthentication(AuthConfig, transporterOptions);
  models.push(authLayer);


  if (AuthConfig.authorization) {
    let authorizeLayer: typeof Model[] = initAuthorization(AuthConfig);
    models.push(...authorizeLayer);
  }

  return models;
}