// provider data is spread into the entity, so only known fields may be stored
const PROVIDER_FIELDS = ['name', 'url', 'apiKey', 'prefs']
const PROVIDER_PREFS = ['enabled', 'types']
// allowed per-type pref keys, by supported type
const PROVIDER_TYPE_PREFS: Record<string, string[]> = {
  song: ['enabled', 'maxLibraryResults'],
}
const MAX_LIBRARY_RESULTS_LIMIT = 10000
// the provider API caps its other text fields at 1024 bytes; name has no limit
// there, but it is stored and broadcast to every client
const MAX_NAME_LENGTH = 1024

// also rules out null, which json_patch would treat as a delete
function isPlainObject (val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === 'object' && !Array.isArray(val)
}

/**
 * Validate provider fields from a request body
 * @return an error message, or null if valid
 */
export default function validateProviderFields (fields: Record<string, unknown>): string | null {
  for (const key of Object.keys(fields)) {
    if (!PROVIDER_FIELDS.includes(key)) return 'Unsupported provider field: ' + key
  }

  if ('name' in fields && (!fields.name || typeof fields.name !== 'string' || fields.name.length > MAX_NAME_LENGTH)) return 'Invalid name'
  if ('url' in fields && (!fields.url || typeof fields.url !== 'string')) return 'Invalid url'
  if ('apiKey' in fields && typeof fields.apiKey !== 'string') return 'Invalid apiKey'

  if ('prefs' in fields) {
    const { prefs } = fields
    if (!isPlainObject(prefs)) return 'Invalid prefs'

    for (const key of Object.keys(prefs)) {
      if (!PROVIDER_PREFS.includes(key)) return 'Unsupported provider pref: ' + key
    }

    if ('enabled' in prefs && typeof prefs.enabled !== 'boolean') return 'Invalid enabled'

    if ('types' in prefs) {
      if (!isPlainObject(prefs.types)) return 'Invalid types'

      for (const [type, typePrefs] of Object.entries(prefs.types)) {
        const allowed = PROVIDER_TYPE_PREFS[type]
        if (!allowed) return 'Unsupported provider type: ' + type
        if (!isPlainObject(typePrefs)) return `Invalid ${type} prefs`

        for (const key of Object.keys(typePrefs)) {
          if (!allowed.includes(key)) return `Unsupported ${type} pref: ${key}`
        }

        if ('enabled' in typePrefs && typeof typePrefs.enabled !== 'boolean') return `Invalid ${type} enabled`

        if ('maxLibraryResults' in typePrefs) {
          const { maxLibraryResults } = typePrefs
          if (maxLibraryResults !== null && (!Number.isInteger(maxLibraryResults) || (maxLibraryResults as number) < 0 || (maxLibraryResults as number) > MAX_LIBRARY_RESULTS_LIMIT)) {
            return 'Invalid maxLibraryResults'
          }
        }
      }
    }
  }

  return null
}
