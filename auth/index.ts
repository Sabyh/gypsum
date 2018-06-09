import { APP } from "../decorators";
import { App } from "../app";
import { State } from "../state";
import { Users } from "./users";
import { MongoModel } from "../models";
import { Authorization } from "./authorization";
import { Roles } from "./roles";
import { Groups } from "./groups";
import { Permissions } from "./permissions";

export function initAuth(extendedUsersModel?: typeof MongoModel) {

  @APP({
    dev: {
      mongodb_url: State.auth.mongodb_url,
      database_name: State.config.server_name + '_auth_dev',
      cors: State.auth.cors,
      namespaces: State.auth.namespaces,
      models: [(extendedUsersModel || Users), Permissions, Authorization, Roles, Groups]
    },
    prod: {
      database_name: State.config.server_name + '_auth',
    }
  })
  class Auth extends App {}
  
  let auth = new Auth();
  
  State.apps.push(auth);
}
