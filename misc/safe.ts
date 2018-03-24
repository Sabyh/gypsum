const symbols: { [key: string]: { value: any, friends: string[], owner: string } } = {};

const grantListStatus: any = {
  mongo: false,
  state: false,
  context: false,
  model: false,
  ioServer: false,
  mongoModel: false,
  fileModel: false,
  main: false,
  app: false
};

export class Safe {
  name: string;
  
  constructor(name: string) {
    if (!grantListStatus.hasOwnProperty(name))
      throw new Error(`${name} module is not granted an access the safe`);

    if (grantListStatus[name] === true)
      throw new Error(`${name} already accessed the safe`);

    this.name = name;
    grantListStatus[name] = true;
  }

  get<T = Symbol>(item: string): T {
    if (!symbols.hasOwnProperty(item))
      throw new Error(`${item} does not exists in safe`);
    
    if (symbols[item].friends.indexOf(this.name) > -1)
      return symbols[item].value;
    
    throw new Error(`${this.name} is no friend for: ${symbols[item].owner}`);
  }

  set<T = Symbol>(item: string, friends: string[]): T {
    symbols[item] = { value: Symbol(), friends, owner: this.name }
    return symbols[item].value;
  }
}