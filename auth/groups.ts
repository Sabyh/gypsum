import { MODEL } from "../decorators";
import { MongoModel } from "../models";
import { Authorization } from "./authorization";
import { State } from "../state";
import { RESPONSE_DOMAINS } from "../types";

@MODEL({
  secure: true,
  authorize: true,
  domain: RESPONSE_DOMAINS.SELF,
  schema: {
    name: 'string',
    roles: 'string[]',
    users: 'string[]'
  },
  schemaOptions: { required: true }
})
export class Groups extends MongoModel {}