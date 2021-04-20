import { createSelector } from 'reselect'

const getResult = (state) => state.users.result
const getEntities = (state) => state.users.entities

const getUsers = createSelector(
  [getResult, getEntities],
  (result, entities) => ({
    result,
    entities,
  }))

export default getUsers
