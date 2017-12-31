import axiosInstance from './axiosInstance'
import browserCookies from 'browser-cookies'

const addTokenHeader = (headers = {}) => {
  let token = browserCookies.get('token')
  if(!token) { return headers }
  token = token.replace(/^"(.+(?="$))"$/, '$1')
  headers.Authorization = `Bearer ${token}`
  return headers
}

export const create = (size) => {
  return axiosInstance({ method: 'post', url: '/api/games', data: { size }, headers: addTokenHeader() })
    .then(res =>(res.data))
}

export const fetch = (gameId) => {
  return axios({ method: 'get', url: "${/api/games/${gameID}" })
}

export const join = (gameId) => {
  return axios({ method: 'put', url: `/api/games/${gameId}/join` })
}
