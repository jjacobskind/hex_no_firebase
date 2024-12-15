import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

const tokenKey = 'hex-token'

const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return decoded
  } catch (e) {
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedToken = localStorage.getItem(tokenKey)
    if (storedToken) {
      setToken(storedToken)
      const payload = decodeToken(storedToken)
      if (payload && payload.exp > Date.now() / 1000) {
        setUser({ username: payload.username })
      } else {
        localStorage.removeItem(tokenKey)
      }
    }
  }, [])

  const isLoggedIn = () => {
    if (!token) return false
    const payload = decodeToken(token)
    if (!payload) return false
    return payload.exp > Date.now() / 1000
  }

  const currentUser = () => {
    if (!isLoggedIn()) return null
    return user ? user.username : null
  }

  const saveToken = (newToken) => {
    localStorage.setItem(tokenKey, newToken)
    setToken(newToken)
    const payload = decodeToken(newToken)
    if (payload && payload.exp > Date.now() / 1000) {
      setUser({ username: payload.username })
    } else {
      setUser(null)
    }
  }

  const register = async (userData) => {
    // userData: { username, password } 
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    if (!response.ok) {
      throw new Error('Registration failed')
    }
    const data = await response.json()
    saveToken(data.token)
  }

  const login = async (userData) => {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    if (!response.ok) {
      throw new Error('Login failed')
    }
    const data = await response.json()
    saveToken(data.token)
  }

  const logout = () => {
    localStorage.removeItem(tokenKey)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn, currentUser, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}