/**
 * Converts a FormData object into a plain JavaScript object.
 * If a key appears multiple times (e.g., checkboxes or multi-select inputs),
 * it stores them as an array.
 */
export const getFormData = (formData: FormData): Record<string, string | string[]> => {
  const obj: Record<string, string | string[]> = {}

  formData.forEach((value, key) => {
    if (obj[key]) {
      obj[key] = [].concat(obj[key], value as string)
    } else {
      obj[key] = value as string
    }
  })

  return obj
}
