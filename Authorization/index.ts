import { State } from '../state';
import { Authorization } from './main';
import { AuthRoles } from './roles';
import { AuthGroups } from './groups';
import { Permissions } from './permissions';
import { Logger } from '../misc/logger';

export function initAuthorization(): void {
  Logger.Info('Initializing Authorization Layer...');
  State.Models.push(Authorization, AuthRoles, AuthGroups, Permissions);
}