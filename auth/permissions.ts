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

      let result: any = [];

      for (let j = 0; j < State.apps.length; j++) {
        if (State.apps[j].models && State.apps[j].models.length) {

          for (let i = 0; i < State.apps[i].models.length; i++) {
            let model = State.apps[i].models[i];
            let modelName = model.name;
            let record: { model: string; services: string[] } = { model: modelName, services: [] };
            let services = model.$getServices();

            if (Object.keys(services).length)
              for (let prop in services)
                record.services.push(prop);

            result.push(record);
          }
        }
      }

      resolve({ data: result });
    });
  }
}