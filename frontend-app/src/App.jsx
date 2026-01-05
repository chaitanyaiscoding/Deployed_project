
import { useState } from 'react'
import './App.css'

function App() {
  const [paragraph, setParagraph] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClick = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('api/random-paragraph/')
      if (!response.ok) {
        throw new Error('Failed to fetch paragraph')
      }
      const data = await response.json()
      setParagraph(data.paragraph)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div style={{ padding: '20px' }}>
        <button onClick={handleClick} disabled={loading}>
          {loading ? 'Loading...' : 'Click on me I will get a Random small paragraph from the backend via api call and i will show you'}
        </button>
        
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        
        {paragraph && (
          <div style={{ marginTop: '20px', whiteSpace: 'pre-line' }}>
            <h3>Random Paragraph:</h3>
            <p>{paragraph}</p>
          </div>
        )}
      </div>
    </>
  )
}

export default App
