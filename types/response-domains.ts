export enum RESPONSE_DOMAINS {
  /**
   * Only response to the request issuer.
   */
  SELF = 1,
  /**
   * Publish for specific room if provided but not the request issuer.
   */
  ROOM,
  /**
   * Publish for specific room if provided including the request issuer.
   */
  ALL_ROOM,
  /**
   * Publish for all connected users but not the request issuer.
   */
  OTHERS,
  /**
   * Publish for all connected users including the request issuer.
   */
  ALL
}
