import { useState, useEffect } from 'react'
import BigNumber from 'bignumber.js'
import Window from 'components/Window/Window'
import styles from 'styles/Farms.module.css'
import Button from 'components/Button/Button'
import StakeModal from 'components/Modal/StakeModal'
import ErrorModal from 'components/Modal/ErrorModal'
import { accountBalance } from 'utils/library'
import { addresses } from 'utils/constants'
import { shorten } from 'utils/string'
import { getEtherscan } from 'utils/links'

export default function Farms(props) {
  const {
    state: {
      account,
      transactions,
      requests,
      farmAllowances,
      farmBalances,
      stakedBalances,
      rewardBalances,
    },
    dispatch,
    library,
  } = props
  const from = { from: account.address }
  const toChecksumAddress = library && library.web3.utils.toChecksumAddress
  const toWei = (value, decimals = 18) =>
    decimals < 18
      ? new BigNumber(value).times(10 ** decimals)
      : library.web3.utils.toWei(value)
  const [selectedPool, setSelectedPool] = useState(null)
  const [type, setType] = useState('stake')
  const [farm, setFarm] = useState({
    asset: '',
    contractAddress: '',
    underlyingAddress: '',
    underlyingDecimals: 8,
  })
  const [isOpen, setIsOpen] = useState(false)
  const [farms, setFarms] = useState([])
  const [errMessage, setErrMessage] = useState('')

  const transactionMap = transactions.reduce(
    ([stakes], [hash, type, ...args]) => {
      const transaction = {
        stakes: {},
      }
      switch (type) {
        case 'stake':
          transaction.stakes[args[0]] = hash
          break
        default:
          break
      }
      return [{ ...stakes, ...transaction.stakes }]
    },
    new Array(4).fill({})
  )

  useEffect(() => {
    if (farmBalances && stakedBalances && rewardBalances) {
      setFarms(
        addresses[account.network].Farms.map((f) => ({
          ...f,
          balance: farmBalances[f.underlyingAddress.toLowerCase()],
          stakedBalance: stakedBalances[f.underlyingAddress.toLowerCase()],
          rewardBalance: rewardBalances[f.underlyingAddress.toLowerCase()],
        }))
      )
    }
  }, [farmBalances, stakedBalances, rewardBalances])

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
          if (err && err.message) {
            setErrMessage(err.message)
          }
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

  const handleTokens = (_farm, btnRoleType) => {
    setFarm(_farm)
    const methods = library.methods.Farm(library.Farm(_farm).farmContract)
    switch (btnRoleType) {
      case 'stake':
        setType('stake')
        setIsOpen(true)
        break
      case 'claim':
        const claimTransaction = methods.claim(from)
        handleTransaction('stake', farm.asset)(claimTransaction.send(), () =>
          setIsOpen(false)
        )
        break
      case 'unstake':
        setType('unstake')
        setIsOpen(true)
        break
      case 'claim_unstake':
        const exitTransaction = methods.exit(from)
        handleTransaction('stake', farm.asset)(exitTransaction.send(), () =>
          setIsOpen(false)
        )
        break
    }
  }

  const handleStake = (form) => {
    const _farm = farms.find((f) => f.asset.indexOf(farm.asset) !== -1)
    if (farmAllowances[farm.underlyingAddress] <= 0) {
      // Approve
      const methods = library.methods.Market(library.Farm(farm).tokenContract)
      const amount = 10 ** Math.min(_farm.underlyingDecimals, 8)
      handleTransaction('stake', farm.asset)(
        methods
          .approve(
            toChecksumAddress(farm.contractAddress),
            toWei(amount.toString()),
            from
          )
          .send(),
        () =>
          dispatch({
            type: 'farmAllowances',
            payload: { [_farm.underlyingAddress]: amount },
          })
      )
    } else {
      const { amount, type } = form
      const methods = library.methods.Farm(library.Farm(farm).farmContract)
      if (type === 'stake') {
        const transaction = methods.stake(
          toWei(amount.toString(), _farm.underlyingDecimals),
          from
        )
        handleTransaction('stake', farm.asset)(transaction.send(), () =>
          setIsOpen(false)
        )
      } else {
        const transaction = methods.withdraw(
          toWei(amount.toString(), _farm.underlyingDecimals),
          from
        )
        handleTransaction('stake', farm.asset)(transaction.send(), () =>
          setIsOpen(false)
        )
      }
    }
  }

  const current = selectedPool && farms[selectedPool.pId]

  return (
    <>
      <section className={styles.header}></section>
      <section className={`${styles.content} flex flex-start justify-center`}>
        <div className={`${styles.grid} fill`} />
        {farms.length === 0 && (
          <div
            className={`${styles.container} limited flex-center flex-column justify-center`}
          >
            <div className={styles.emptyFarm}>
              <Window labels={{ title: `No token distributions` }}>
                <div className={`${styles.emptyInfo} center`}>
                  no token distributions available at the moment, please call
                  customer service if you think this is an error
                </div>
              </Window>
            </div>
          </div>
        )}
        {!current && farms.length !== 0 && (
          <div
            className={`${styles.container} limited flex-center flex-column justify-center`}
          >
            <div className={styles.pool}>
              {farms.map(
                (
                  {
                    title,
                    asset,
                    contractAddress,
                    website,
                    websiteUrl,
                    market,
                    marketUrl,
                    totalDistribution,
                    rewardAsset,
                  },
                  idx
                ) => (
                  <Window
                    classes={{ window: 'full' }}
                    labels={{ title }}
                    key={contractAddress}
                  >
                    <div className={styles.title}>{asset}</div>
                    <div className={styles.poolinfo}>
                      <div>
                        Contract Address:{' '}
                        <a
                          href={getEtherscan(
                            contractAddress,
                            account.network,
                            'address'
                          )}
                          target="_blank"
                        >
                          {shorten(contractAddress)}
                        </a>
                      </div>
                      <div>
                        Website Address:{' '}
                        <a href={websiteUrl} target="_blank">
                          {website}
                        </a>
                      </div>
                      <div>
                        Market buy:{' '}
                        <a href={marketUrl} target="_blank">
                          {market}
                        </a>
                      </div>
                      <div>
                        Total Distribution:{' '}
                        {new BigNumber(totalDistribution).toFormat(2)}
                      </div>
                    </div>
                    <div
                      className={`${styles.stakeBtn} flex-center flex-column justify-center`}
                    >
                      <div className={styles.stakeText}>STAKE THIS ASSET?</div>
                      <Button
                        className="full"
                        onClick={() => setSelectedPool({ pId: idx })}
                      >
                        Get {rewardAsset}
                      </Button>
                    </div>
                  </Window>
                )
              )}
            </div>
          </div>
        )}
        {current && (
          <div
            className={`${styles.container} limited flex-center flex-column justify-center`}
          >
            <div className={styles.stake} key={current.asset}>
              <Window
                labels={{ title: `Farm BLO/${current.asset}` }}
                onClose={() => setSelectedPool(null)}
              >
                <div className={styles.stakeinfo}>
                  <div>
                    Your Balance: {current.balance} {current.asset}
                  </div>
                  <div>Currently Staked: {current.stakedBalance}</div>
                  <div>
                    Rewards Available:{' '}
                    {new BigNumber(current.rewardBalance).dp(4, 1).toString(10)}{' '}
                    BLO
                  </div>
                </div>
                <div
                  className={`${styles.btnWrapper} flex-center justify-center`}
                >
                  <Button onClick={() => handleTokens(current, 'stake')}>
                    Stake Tokens
                  </Button>
                  <Button onClick={() => handleTokens(current, 'claim')}>
                    Claim Rewards
                  </Button>
                  <Button onClick={() => handleTokens(current, 'unstake')}>
                    Unstake Tokens
                  </Button>
                  <Button
                    onClick={() => handleTokens(current, 'claim_unstake')}
                  >
                    Claim &amp; Unstake
                  </Button>
                </div>
              </Window>
            </div>
          </div>
        )}
      </section>
      <StakeModal
        network={account.network}
        type={type}
        isOpen={isOpen}
        allowed={
          farm.underlyingAddress &&
          farmAllowances[farm.underlyingAddress.toLowerCase()] > 0
        }
        pending={farm && requests.stake === farm.asset}
        disabled={farm && transactionMap[0][farm.asset]}
        farm={farm}
        onSubmit={handleStake}
        onClose={() => setIsOpen(false)}
      />
      <ErrorModal errMessage={errMessage} onClose={() => setErrMessage('')} />
    </>
  )
}
