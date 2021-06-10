import { AppProps } from 'next/app'
import Head from 'next/head'
import Layout from 'layout'
import '98.css'
import 'styles/globals.css'
import 'styles/custom-98.css'

import { useEffect, useState } from 'react'
import { getMarkets } from 'utils/library'

function App({ Component, router }: AppProps) {
  const [markets, setMarkets] = useState(null)
  console.log(markets)
  const cleanCash = (market) => ({ ...market, cash: 0 })
  useEffect(() => {
    getMarkets()
      .then(([markets, rinkebyMarkets, maticMarkets]) =>
        setMarkets({
          1: markets.map(cleanCash),
          4: rinkebyMarkets.map(cleanCash),
          137: maticMarkets.map(cleanCash),
        })
      )
      .catch((err) => console.log('getAllMarkets', err))
  }, [])
  return markets ? (
    <Layout router={router} networks={[1, 4, 137]} markets={markets}>
      <Component />
    </Layout>
  ) : (
    <>
      <Head>
        <title>Based Loans</title>
      </Head>
      <div className="fill flex-center justify-center">
        <img src="/assets/loading.gif" />
      </div>
    </>
  )
}

export default App
