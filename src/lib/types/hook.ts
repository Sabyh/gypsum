export interface IHook {
  isHook: boolean;
  name: string;
  private: boolean;
}

export type IHookOptions = string | { name: string, args?: any }