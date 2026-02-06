import { describe, it, expect } from 'vitest'
import { HYDRA_REFERENCE } from './hydraReference'

describe('HYDRA_REFERENCE metadata coverage', () => {
  it('provides teaching metadata for every function', () => {
    for (const category of HYDRA_REFERENCE) {
      for (const fn of category.functions) {
        expect(typeof fn.description, `${category.label}.${fn.name} missing description`).toBe('string')
        expect(fn.description?.trim().length, `${category.label}.${fn.name} empty description`).toBeGreaterThan(0)

        expect(typeof fn.whenToUse, `${category.label}.${fn.name} missing whenToUse`).toBe('string')
        expect(fn.whenToUse?.trim().length, `${category.label}.${fn.name} empty whenToUse`).toBeGreaterThan(0)

        expect(typeof fn.pitfall, `${category.label}.${fn.name} missing pitfall`).toBe('string')
        expect(fn.pitfall?.trim().length, `${category.label}.${fn.name} empty pitfall`).toBeGreaterThan(0)

        expect(typeof fn.example, `${category.label}.${fn.name} missing example`).toBe('string')
        expect(fn.example?.trim().length, `${category.label}.${fn.name} empty example`).toBeGreaterThan(0)

        expect(Array.isArray(fn.related), `${category.label}.${fn.name} related must be array`).toBe(true)
        expect(fn.related?.length, `${category.label}.${fn.name} should have at least one related function`).toBeGreaterThan(0)
      }
    }
  })
})
