import { useEffect, useState } from 'react'
import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'
import BasedLoanLibrary from 'lib/index'
import { addresses } from 'utils/constants'
import { accountBalance } from 'utils/library'

let web3Modal

type TWallet = [boolean, Function, any]

const events = [
  'CompSpeedUpdated',
  'DistributedBorrowerComp',
  'DistributedSupplierComp',
  'MarketComped',
  'MarketEntered',
  'MarketExited',
  'NewBorrowCap',
  'NewBorrowCapGuardian',
  'NewCloseFactor',
  'NewCollateralFactor',
  'NewCompRate',
  'NewLiquidationIncentive',
  'NewMaxAssets',
  'NewPriceOracle',
]

export default function useWallet(dispatch, markets) {
  const [library, setLibrary] = useState(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: '74d05a47b2814d4da023f4839fafbe9b', // Required
        },
      },
    }
    web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions,
    })
  }, [])

  const initLibrary = (provider) => {
    if (library) {
      library.setProvider(provider)
    } else {
      setLibrary(
        new BasedLoanLibrary(provider, {
          onEvent: (event: any) => {
            switch (event.event) {
              case 'WALLET': {
                if (event.status === 3) {
                  dispatch({ type: 'disconnect' })
                } else {
                  if (event.status !== 0) {
                    dispatch({ type: 'account', payload: event.data })
                  }
                  accountBalance(library, dispatch)
                }
                break
              }
              case 'MARKETS': {
                dispatch({ type: 'markets', payload: event.data })
                break
              }
              default: {
                if (event.event && events.includes(event.event)) {
                  console.log(event)
                  // accountBalance(library, dispatch)
                }
                break
              }
            }
          },
          addresses,
          markets,
        })
      )
    }
  }

  async function getProvider(refresh) {
    if (refresh && web3Modal) {
      web3Modal.clearCachedProvider()
    }
    try {
      setLoading(true)
      const provider = await web3Modal.connect()
      setLoading(false)
      return provider
    } catch (e) {
      setLoading(false)
      return null
    }
  }

  function connectWallet(refresh = false) {
    getProvider(refresh).then((provider) => {
      if (provider) initLibrary(provider)
    })
  }

  const ret: TWallet = [loading, connectWallet, library]
  return ret
}
