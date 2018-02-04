export function HOOK(options: { private: boolean } = { private: false }) {

  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    descriptor.value.isHook = true;
    descriptor.value.private = options.private;
    descriptor.enumerable = true;
    descriptor.configurable = true;
  
    return descriptor;
  }
}