import { Model } from '../model/model';
import { MODEL } from '../decorators/model';
import { SERVICE } from '../decorators/service'
import { Context } from '../context';
import { State } from '../state';

@MODEL({
  secure: true,
  authorize: true
})
export class Permissions extends Model {

  @SERVICE()
  find(ctx: Context) {
    let models = State.models;

    let result: any = [];

    for (let i = 0; i < models.length; i++) {
      let modelName = models[i].$get('name');
      let record: { model: string; services: string[] } = { model: modelName, services: [] };

      let services = models[i].$getServices();

      if (Object.keys(services).length)
        for (let prop in services)
          record.services.push(prop);
      
      result.push(record);
    }

    ctx.ok(result);
  }
}