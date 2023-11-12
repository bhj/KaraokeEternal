import { persistStore } from 'redux-persist'

export default class Persistor {
  private static instance: ReturnType<typeof persistStore>

  public static init (store, cb: () => void) {
    this.instance = persistStore(store, null, cb)
    return this.instance
  }

  public static get (): typeof this.instance {
    if (!this.instance) {
      throw new Error('persistor not initialized')
    }

    return this.instance
  }
}
