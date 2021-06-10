import React, { useEffect, useState } from 'react'
import { TMap } from 'types'
import styles from './Account.module.css'
import BloModal from 'components/Modal/BloModal'
import { accountBalance } from 'utils/library'
import NetworkModal from 'components/Modal/NetworkModal'

const networks = {
  // 1: {
  //   chainId: '0x1',
  //   chainName: 'Ethereum Mainnet',
  //   nativeCurrency: {
  //     name: 'Ethereum',
  //     symbol: 'ETH',
  //     decimals: 18,
  //   },
  //   rpcUrls: ["https://mainnet.infura.io/v3"],
  //   blockExplorerUrls: ['https://etherscan.io/'],
  // },
  56: {
    chainId: '0x38',
    chainName: 'Binance Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com/'],
  },
  137: {
    chainId: '0x89',
    chainName: 'Matic Network',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://rpc-mainnet.maticvigil.com'],
    blockExplorerUrls: ['https://explorer-mainnet.maticvigil.com/'],
  },
}

export const netLabels = {
  1: 'Ethereum',
  4: 'Ethereum',
  137: 'Matic',
}
const logos = {
  1: 'eth',
  4: 'eth',
  137: 'matic',
}

interface IAccount {
  bloPrice: number
  library: any
  transactions: any
  requests: any
  loading: boolean
  account: TMap
  rewardBalance: string
  bloBalance: string
  dispatch: Function
  connectWallet: Function
}

export default function Account({
  bloPrice,
  dispatch,
  library,
  transactions,
  requests,
  loading = false,
  account,
  rewardBalance,
  bloBalance,
  connectWallet,
}: IAccount) {
  const [isClicked, setIsClicked] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const bloMarket =
    library &&
    library.markets &&
    library.markets.find((m) => m.underlyingSymbol === 'BLO')

  const transactionMap = transactions.reduce(
    ([claim], [hash, type, ...args]) => {
      const transaction = {
        claim: {},
      }
      switch (type) {
        case 'claim':
          transaction.claim[args[0]] = hash
          break
        default:
          break
      }
      return [{ ...claim, ...transaction.claim }]
    },
    new Array(1).fill({})
  )

  const handleTransaction =
    (type, ...args) =>
    (transaction, callback = () => {}) => {
      dispatch({
        type: 'txRequest',
        payload: [type, true, ...args],
      })
      transaction
        .on('transactionHash', function (hash) {
          dispatch({
            type: 'txHash',
            payload: [hash, false, type, ...args],
          })
        })
        .on('receipt', function (receipt) {
          dispatch({
            type: 'txHash',
            payload: [receipt.transactionHash, true, type, callback()],
          })
          accountBalance(library, dispatch)
        })
        .on('error', (err, receipt) => {
          if (receipt) {
            dispatch({
              type: 'txHash',
              payload: [receipt.transactionHash, true, type],
            })
          } else {
            dispatch({
              type: 'txRequest',
              payload: [type, false, ...args],
            })
          }
        })
    }

  const handleClaimBlo = () => {
    const from = { from: account.address }
    const transaction = library.methods.Comptroller.claimComp(
      account.address,
      from
    )
    handleTransaction('claim', 'claim')(transaction.send())
  }

  const [selected, setSelected] = useState(account.network)
  const [showSwitch, setShowSwitch] = useState(false)

  useEffect(() => {
    if (account.network !== selected) {
      setSelected(account.network)
    }
  }, [account.network])

  const handleNetwork = (network) => {
    const origin = selected
    setSelected(network)
    if (!networks[network]) return
    library.web3.currentProvider
      .request({
        method: 'wallet_addEthereumChain',
        params: [networks[network]],
      })
      .then(() => setShowSwitch(false))
      .catch(() => setSelected(origin))
  }

  return (
    <div className={styles.account}>
      <div className={styles.info}>
        {(!loading || account.network) && netLabels[selected] && (
          <>
            <div
              className="flex-center cursor"
              onClick={() => setShowSwitch(true)}
            >
              <p>{netLabels[selected]}</p>
              <img
                className={`${styles.tokenIcon} ${
                  selected !== account.network ? styles.flicking : ''
                }`}
                src={`/assets/networks/${logos[selected]}.png`}
              />
            </div>
            <div className="flex-center cursor" onClick={() => setIsOpen(true)}>
              <p>{Number(rewardBalance || 0).toFixed(4)}</p>
              <img className={styles.tokenIcon} src="/assets/token.png" />
            </div>
          </>
        )}
        {!account.address ? (
          <div
            className="cursor"
            onClick={() => {
              setIsClicked(true)
              connectWallet(true)
            }}
          >
            {isClicked || account.network ? 'No account' : 'Connect wallet'}
          </div>
        ) : (
          netLabels[selected] && <p className="cursor" onClick={() => connectWallet(true)}>
            {`${account.address.substr(0, 6)}...${account.address.substr(
              -4,
              4
            )}`}
          </p>
        )}
      </div>
      <BloModal
        isOpen={isOpen}
        pending={isOpen && !!requests.claim}
        balance={Number(bloBalance)}
        rewardBalance={Number(rewardBalance)}
        price={bloMarket ? bloMarket.underlyingPriceUSD : bloPrice}
        disabled={isOpen && transactionMap[0].claim}
        onSubmit={handleClaimBlo}
        onClose={() => setIsOpen(false)}
        network={account.network}
      />
      <NetworkModal
        show={showSwitch}
        network={selected}
        current={account.network}
        onNetwork={handleNetwork}
        onClose={() => setShowSwitch(false)}
      />
    </div>
  )
}
