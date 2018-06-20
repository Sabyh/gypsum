export enum RESPONSE_DOMAINS {
  /**
   * Only respond to the request issuer.
   */
  SELF = 1,
  /**
   * Publish for specific room if provided.
   */
  ROOM,
  /**
   * Publish for all connected users including the request issuer.
   */
  ALL
}
