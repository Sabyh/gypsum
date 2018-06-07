import { MODEL, SERVICE } from "../decorators";
import { Model } from "../models";
import { IResponse, RESPONSE_DOMAINS } from "../types";
import { State } from "../state";

@MODEL({
  secure: true,
  authorize: true,
  domain: RESPONSE_DOMAINS.SELF,
})
export class Permissions extends Model {

  @SERVICE()
  find(): Promise<IResponse> {
    return new Promise((resolve, reject) => {

      let result: string[] = [];

      for (let j = 0; j < State.apps.length; j++) {
        result.push(...State.apps[j].$getMap());
      }

      resolve({ data: result });
    });
  }
}