import React, { useEffect, useState } from 'react'
import { api } from '../app/apiClient'

const ProfilePage = () => {
  const [user, setUser] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/auth/profile/')
      .then((response) => {
        setUser(response.data)
      })
      .catch((requestError) => {
        setError(requestError.message)
      })
  }, [])

  const handleUpdate = (event) => {
    event.preventDefault()

    api
      .put('/api/auth/profile/update/', user)
      .then((response) => {
        setUser(response.data)
      })
      .catch((requestError) => {
        setError(requestError.message)
      })
  }

  return (
    <div>
      <h1>Profile Page</h1>
      <form onSubmit={handleUpdate}>
        <label>Username:</label>
        <input
          type="text"
          value={user.username || ''}
          onChange={(event) => setUser({ ...user, username: event.target.value })}
        />
        <br />
        <label>Email:</label>
        <input
          type="email"
          value={user.email || ''}
          onChange={(event) => setUser({ ...user, email: event.target.value })}
        />
        <br />
        <button type="submit">Update</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default ProfilePage
