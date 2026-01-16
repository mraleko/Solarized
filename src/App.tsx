import { Map } from './components/Map'
import { Sidebar } from './components/Sidebar'

function App() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <Map />
    </div>
  )
}

export default App
