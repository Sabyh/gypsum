declare function hash(src: string, salt?: string): Promise<string | [string, string]>;
declare function verify(src: string, hashed: string, salt: string): Promise<boolean>;
export { hash, verify };
