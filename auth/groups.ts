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
    name: { $required: true, $type: 'string' },
    roles: { $required: true, $type: 'string[]' },
    users: { $required: true, $type: 'string[]' }
  }
})
export class Groups extends MongoModel {}