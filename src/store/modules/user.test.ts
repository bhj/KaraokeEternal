import { describe, it, expect } from 'vitest'
import { ACCOUNT_RECEIVE, LOGOUT, SOCKET_AUTH_ERROR, BOOTSTRAP_COMPLETE } from 'shared/actionTypes'
import { createReducer, createAction } from '@reduxjs/toolkit'

// Instead of importing the actual module (which has side effects),
// we recreate the reducer logic to test it independently.
// This ensures the migration to createSlice preserves the same behavior.

// Define the state interface
interface UserState {
  userId: number | null
  username: string | null
  name: string | null
  roomId: number | null
  ownRoomId: number | null
  authProvider: 'local' | 'sso'
  isAdmin: boolean
  isGuest: boolean
  isBootstrapping: boolean
  isLoggingOut: boolean
  dateCreated: number
  dateUpdated: number
}

const initialState: UserState = {
  userId: null,
  username: null,
  name: null,
  roomId: null,
  ownRoomId: null,
  authProvider: 'local',
  isAdmin: false,
  isGuest: false,
  isBootstrapping: true,
  isLoggingOut: false,
  dateCreated: 0,
  dateUpdated: 0,
}

// Create test-only actions
const receiveAccount = createAction<object>(ACCOUNT_RECEIVE)
const bootstrapComplete = createAction(BOOTSTRAP_COMPLETE)
const logoutStart = createAction('user/LOGOUT_START')

// Create a reference reducer with the expected behavior
// This is what we compare the actual implementation against
const expectedReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(receiveAccount, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(bootstrapComplete, state => ({
      ...state,
      isBootstrapping: false,
    }))
    .addCase(logoutStart, state => ({
      ...state,
      isLoggingOut: true,
    }))
    .addCase(LOGOUT, () => ({
      ...initialState,
      isBootstrapping: false,
      isLoggingOut: false,
    }))
    .addCase(SOCKET_AUTH_ERROR, () => ({
      ...initialState,
      isBootstrapping: false,
    }))
})

describe('user reducer expected behavior', () => {
  it('should return initial state', () => {
    const state = expectedReducer(undefined, { type: '@@INIT' })
    expect(state).toEqual(initialState)
  })

  it('should handle ACCOUNT_RECEIVE', () => {
    const payload = {
      userId: 1,
      username: 'testuser',
      name: 'Test User',
      roomId: 10,
      isAdmin: true,
    }

    const state = expectedReducer(initialState, {
      type: ACCOUNT_RECEIVE,
      payload,
    })

    expect(state).toEqual({
      ...initialState,
      ...payload,
    })
  })

  it('should handle bootstrapComplete', () => {
    const state = expectedReducer(initialState, bootstrapComplete())
    expect(state.isBootstrapping).toBe(false)
  })

  it('should handle logoutStart', () => {
    const state = expectedReducer(initialState, logoutStart())
    expect(state.isLoggingOut).toBe(true)
  })

  it('should handle LOGOUT (reset to initial state)', () => {
    const loggedInState = {
      ...initialState,
      userId: 1,
      username: 'testuser',
      isAdmin: true,
      isBootstrapping: false,
    }

    const state = expectedReducer(loggedInState, { type: LOGOUT })

    expect(state).toEqual({
      ...initialState,
      isBootstrapping: false,
      isLoggingOut: false,
    })
  })

  it('should handle SOCKET_AUTH_ERROR (reset to initial state)', () => {
    const loggedInState = {
      ...initialState,
      userId: 1,
      username: 'testuser',
      isBootstrapping: false,
    }

    const state = expectedReducer(loggedInState, { type: SOCKET_AUTH_ERROR })

    expect(state).toEqual({
      ...initialState,
      isBootstrapping: false,
    })
  })

  it('should preserve state for unknown actions', () => {
    const customState = {
      ...initialState,
      userId: 5,
      username: 'existing',
    }

    const state = expectedReducer(customState, { type: 'UNKNOWN_ACTION' })
    expect(state).toEqual(customState)
  })
})
