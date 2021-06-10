import { useEffect, useState } from 'react'

export default function useTicker(interval = 1) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval * 1000)
    return () => timer && clearInterval(timer)
  }, [])

  return [now]
}
