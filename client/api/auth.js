import ApiClient from 'hex-island/client/api/client'

export const login = (email, password) => {
  console.log("HEY")

  return ApiClient
    .post('/auth/login')
    .body({ email, password })
    .send()
}
