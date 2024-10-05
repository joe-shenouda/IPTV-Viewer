import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import ReactPlayer from 'react-player'
import { Tv, Upload, Film } from 'lucide-react'

interface Channel {
  name: string
  url: string
  icon?: string
}

function App() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)

  const loadM3UFromURL = async (url: string) => {
    try {
      const response = await fetch(url)
      const content = await response.text()
      processM3UContent(content)
    } catch (error) {
      console.error('Error loading M3U file:', error)
    }
  }

  const processM3UContent = (content: string) => {
    const lines = content.split('\n')
    const newChannels: Channel[] = []
    let currentChannel: Partial<Channel> = {}

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF:')) {
        const infoLine = lines[i]
        const nameMatch = infoLine.match(/,(.+)$/)
        if (nameMatch) {
          currentChannel.name = nameMatch[1].trim()
        }
        
        const tvgLogoMatch = infoLine.match(/tvg-logo="([^"]+)"/)
        if (tvgLogoMatch) {
          currentChannel.icon = tvgLogoMatch[1]
        }
      } else if (lines[i].trim() !== '' && !lines[i].startsWith('#')) {
        currentChannel.url = lines[i].trim()
        if (currentChannel.name && currentChannel.url) {
          newChannels.push(currentChannel as Channel)
          currentChannel = {}
        }
      }
    }

    setChannels(newChannels)
    if (newChannels.length > 0) {
      setCurrentChannel(newChannels[0])
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      processM3UContent(content)
    }

    reader.readAsText(file)
  }, [])

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'm3u': ['.m3u'] } })

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <Tv className="mr-2" /> Full Screen TV Viewer
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => loadM3UFromURL('https://raw.githubusercontent.com/ipstreet312/freeiptv/master/all.m3u')}
            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded flex items-center"
          >
            <Tv className="mr-2" /> TV
          </button>
          <button
            onClick={() => loadM3UFromURL('https://iptv-org.github.io/iptv/categories/movies.m3u')}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded flex items-center"
          >
            <Film className="mr-2" /> Movies
          </button>
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} />
            <button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded flex items-center">
              <Upload className="mr-2" /> Upload M3U
            </button>
          </div>
        </div>
      </header>
      <main className="flex flex-grow overflow-hidden">
        <div className="w-1/4 bg-gray-800 p-4 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Channels</h2>
          <ul>
            {channels.map((channel, index) => (
              <li
                key={index}
                className={`cursor-pointer p-2 hover:bg-gray-700 ${currentChannel?.name === channel.name ? 'bg-gray-700' : ''}`}
                onClick={() => setCurrentChannel(channel)}
              >
                <div className="flex items-center">
                  {channel.icon && (
                    <img src={channel.icon} alt={channel.name} className="w-6 h-6 mr-2 object-contain" />
                  )}
                  <span className="font-bold">{channel.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-3/4 relative bg-black">
          {currentChannel ? (
            <div className="absolute inset-0">
              <ReactPlayer
                url={currentChannel.url}
                playing
                controls
                width="100%"
                height="100%"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-xl">No channel selected</p>
                <p className="text-gray-400">Click a predefined button or upload an M3U file to start watching</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App