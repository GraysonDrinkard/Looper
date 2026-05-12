import { useState } from 'react'
import { SimpleMode } from '@renderer/components/SimpleMode'
import { AdvancedMode } from '@renderer/components/AdvancedMode'

type Mode = 'simple' | 'advanced'

function App(): JSX.Element {
  const [mode, setMode] = useState<Mode>('simple')

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-lg font-semibold tracking-widest uppercase text-gray-300">
          Looper
        </h1>
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setMode('simple')}
            className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
              mode === 'simple' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setMode('advanced')}
            className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
              mode === 'advanced' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Advanced
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {mode === 'simple' ? <SimpleMode /> : <AdvancedMode />}
      </main>
    </div>
  )
}

export default App
