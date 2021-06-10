import { useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'
import Balance from 'components/Balance/Balance'
import Window from 'components/Window/Window'
import SupplyMarket from 'components/Market/SupplyMarket'
import BorrowMarket from 'components/Market/BorrowMarket'
import CollateralModal from 'components/Modal/CollateralModal'
import SupplyModal from 'components/Modal/SupplyModal'
import BorrowModal from 'components/Modal/BorrowModal'
import { ZERO } from 'utils/constants'
import { accountBalance } from 'utils/library'
import styles from 'styles/App.module.css'

let gasInterval = null

export default function App(props) {
  const {
    state: {
      account,
      transactions,
      requests,
      assetsIn,
      marketBalances,
      marketAllowances,
      marketSupplyRates,
      marketBorrowRates,
      marketDistributeApys,
      supplyBalances,
      borrowBalances,
      totalSupply,
      totalCash,
      totalBorrow,
      netAPY,
    },
    dispatch,
    library,
    markets,
  } = props
  // const markets = []
  const from = { from: account.address }
  const network = account.network
  const toChecksumAddress = library && library.web3.utils.toChecksumAddress
  const toWei = (value, decimals = 18) =>
    decimals < 18
      ? new BigNumber(value).times(10 ** decimals).toString(10)
      : library.web3.utils.toWei(value)
  const fromWei = (value, decimals = 18) =>
    decimals < 18
      ? new BigNumber(value).div(10 ** decimals).toString(10)
      : library.web3.utils.fromWei(value)
  const transactionMap = transactions.reduce(
    ([supplies, borrows], [hash, type, ...args]) => {
      const transaction = {
        enters: {},
        exits: {},
        supplies: {},
        borrows: {},
      }
      switch (type) {
        case 'supply':
          transaction.supplies[args[0]] = hash
          break
        case 'borrow':
          transaction.borrows[args[0]] = hash
          break
        default:
          break
      }
      return [
        { ...supplies, ...transaction.supplies },
        { ...borrows, ...transaction.borrows },
      ]
    },
    new Array(4).fill({})
  )

  const [gas, setGas] = useState(null)
  const [enterMarket, setEnterMarket] = useState(null)
  const [supply, setSupply] = useState(null)
  const [borrow, setBorrow] = useState(null)

  function getGas() {
    if (library) {
      Promise.all([
        library.web3.eth.getBlock('latest'),
        library.web3.eth.getGasPrice(),
      ]).then(([block, gasPrice]) => {
        if (block)
          setGas(
            (fromWei(gasPrice) * block.gasLimit) / block.transactions.length
          )
      })
    }
  }
  useEffect(() => {
    if (library) {
      gasInterval = setInterval(() => {
        getGas()
      }, 60 * 1000)
      getGas()
    }
    return () => gasInterval && clearInterval(gasInterval)
  }, [library])

  useEffect(() => {
    if (account.address) {
      accountBalance(library, dispatch)
      getAssetsIn()
    }
  }, [account.address, account.network])

  useEffect(() => {
    if (library && supply && supply.supplyBalance < 0) {
      const methods = library.methods.BToken(library.BToken(supply))
      Promise.all([
        methods.getBalance(account.address),
        methods.balanceOfUnderlying(account.address),
      ]).then(([balance, supplyBalance]) => {
        setSupply({
          ...supply,
          bBalance: balance,
          supplyBalance: Number(
            fromWei(supplyBalance, supply.underlyingDecimals)
          ),
        })
      })
    }
  }, [supply, library])

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

  const getAssetsIn = () => {
    const methods = library.methods.Comptroller
    methods
      .getAssetsIn(account.address)
      .then((assetsIn) => {
        dispatch({
          type: 'assetsIn',
          payload: assetsIn,
        })
      })
      .catch((err) => {
        console.log('getAssetsIn', err)
        setTimeout(() => getAssetsIn(), 500)
      })
  }

  const handleEnterMarket = () => {
    const market = enterMarket
    if (library && account.address) {
      const isAssetsIn = assetsIn.includes(toChecksumAddress(market.id))
      const methods = library.methods.Comptroller
      const transaction = isAssetsIn
        ? methods.exitMarket(toChecksumAddress(market.id), from)
        : methods.enterMarkets([toChecksumAddress(market.id)], from)
      handleTransaction('supply', market.id)(transaction.send(), () => {
        getAssetsIn()
        setEnterMarket(null)
      })
    }
  }

  const handleSupplyMarket = (form) => {
    if (marketAllowances[supply.underlyingAddress] <= 0) {
      // Approve
      const amount = 10 ** Math.min(supply.underlyingDecimals, 10)
      const methods = library.methods.Market(library.Market(supply))
      handleTransaction('supply', supply.id)(
        methods
          .approve(toChecksumAddress(supply.id), toWei(amount.toString()), from)
          .send(),
        () =>
          dispatch({
            type: 'allowance',
            payload: { [supply.underlyingAddress]: amount },
          })
      )
    } else {
      const { amount, type } = form
      const methods = library.methods.BToken(library.BToken(supply))
      if (type === 'supply') {
        // Supply
        const transaction =
          supply.underlyingAddress === ZERO
            ? methods.mint({
                ...from,
                value: toWei(amount.toString()),
              })
            : methods.mint(
                toWei(amount.toString(), supply.underlyingDecimals),
                from
              )
        handleTransaction('supply', supply.id)(transaction.send(), () =>
          setSupply(null)
        )
      } else {
        const transaction =
          supply.supplyBalance <= amount
            ? methods.redeem(supply.bBalance, from)
            : methods.redeemUnderlying(
                toWei(amount.toString(), supply.underlyingDecimals),
                from
              )
        handleTransaction('supply', supply.id)(transaction.send(), () =>
          setSupply(null)
        )
      }
    }
  }

  const handleBorrowMarket = (form: any = {}) => {
    const { amount, type } = form
    const methods = library.methods.BToken(library.BToken(borrow))
    if (type === 'borrow') {
      // Borrow
      const transaction = methods.borrow(
        toWei(amount.toString(), borrow.underlyingDecimals),
        from
      )
      handleTransaction('borrow', borrow.id)(transaction.send(), () =>
        setBorrow(null)
      )
    } else {
      if (marketAllowances[borrow.underlyingAddress] <= 0) {
        // Approve
        const amount = 10 ** Math.min(borrow.underlyingDecimals - 2, 12)
        const methods = library.methods.Market(library.Market(borrow))
        handleTransaction('borrow', borrow.id)(
          methods
            .approve(
              toChecksumAddress(borrow.id),
              toWei(amount.toString(), borrow.underlyingDecimals),
              from
            )
            .send(),
          () =>
            dispatch({
              type: 'allowance',
              payload: { [borrow.underlyingAddress]: amount },
            })
        )
      } else {
        const repayAmount =
          amount === -1
            ? new BigNumber(2).pow(256).minus(1).toString(10)
            : toWei(amount.toString(), borrow.underlyingDecimals)
        const transaction =
          borrow.underlyingAddress === ZERO
            ? methods.repayBorrow({
                ...from,
                value: repayAmount,
              })
            : methods.repayBorrow(repayAmount.toString(), from)
        handleTransaction('borrow', borrow.id)(transaction.send(), () =>
          setBorrow(null)
        )
      }
    }
  }

  return (
    <>
      <section className={styles.header}>
        <div className={`limited`}>
          <Balance {...{ totalSupply, totalCash, totalBorrow, netAPY }} />
        </div>
      </section>
      <section className={`${styles.content} flex flex-start justify-center`}>
        <div className={`${styles.grid} fill`} />
        <div className={`${styles.container} limited flex`}>
          <div className="full">
            {markets.filter((m) => +supplyBalances[m.underlyingAddress] > 0)
              .length !== 0 && (
              <Window labels={{ title: 'My Supply Markets' }}>
                <table cellPadding={0} cellSpacing={0}>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>APY/Earned</th>
                      <th>Balance</th>
                      <th>Collateral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markets
                      .filter((m) => +supplyBalances[m.underlyingAddress] > 0)
                      .map((market) => (
                        <SupplyMarket
                          key={market.id}
                          isMyMarkets={true}
                          market={market}
                          assetsIn={assetsIn}
                          balance={
                            supplyBalances[market.underlyingAddress] || '0'
                          }
                          supplyRatePerBlock={fromWei(
                            marketSupplyRates[market.underlyingAddress] || '0',
                            18
                          )}
                          onSupply={() =>
                            setSupply({ ...market, supplyBalance: -1 })
                          }
                          onEnterMarket={(assetIn) =>
                            setEnterMarket({ ...market, assetIn })
                          }
                        />
                      ))}
                  </tbody>
                </table>
              </Window>
            )}
            <Window labels={{ title: 'Supply Markets' }}>
              <table cellPadding={0} cellSpacing={0}>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>APY</th>
                    <th>Wallet</th>
                    <th>Collateral</th>
                  </tr>
                </thead>
                <tbody>
                  {markets
                    .filter((m) => +supplyBalances[m.underlyingAddress] === 0)
                    .map((market) => (
                      <SupplyMarket
                        key={market.id}
                        market={market}
                        assetsIn={assetsIn}
                        balance={
                          marketBalances[market.underlyingAddress] || '0'
                        }
                        supplyRatePerBlock={fromWei(
                          marketSupplyRates[market.underlyingAddress] || '0',
                          18
                        )}
                        onSupply={() =>
                          setSupply({ ...market, supplyBalance: -1 })
                        }
                        onEnterMarket={(assetIn) =>
                          setEnterMarket({ ...market, assetIn })
                        }
                      />
                    ))}
                </tbody>
              </table>
              {markets.filter((m) => +supplyBalances[m.underlyingAddress] === 0)
                .length === 0 && (
                <p className={`${styles.noMarkets} center`}>No Markets</p>
              )}
              <CollateralModal
                network={network}
                pending={enterMarket && requests.supply === enterMarket.id}
                market={enterMarket}
                disabled={enterMarket && transactionMap[0][enterMarket.id]}
                onSubmit={handleEnterMarket}
                onClose={() => setEnterMarket(null)}
              />
              <SupplyModal
                network={network}
                pending={supply && requests.supply === supply.id}
                market={supply}
                assetsIn={assetsIn}
                balance={
                  (supply && marketBalances[supply.underlyingAddress]) || '0'
                }
                current={
                  (supply && supplyBalances[supply.underlyingAddress]) || '0'
                }
                borrowLimit={totalCash}
                supplyRatePerBlock={
                  supply &&
                  fromWei(
                    marketSupplyRates[supply.underlyingAddress] || '0',
                    18
                  )
                }
                borrowLimitUsed={
                  totalCash > 0 ? (totalBorrow / totalCash) * 100 : 0
                }
                totalSupply={totalSupply}
                totalBorrow={totalBorrow}
                distributeApy={
                  (supply &&
                    marketDistributeApys[supply.underlyingAddress] &&
                    marketDistributeApys[supply.underlyingAddress][0]) ||
                  '-'
                }
                gas={Number(gas)}
                disabled={supply && transactionMap[0][supply.id]}
                allowed={
                  supply && marketAllowances[supply.underlyingAddress] > 0
                }
                onSubmit={handleSupplyMarket}
                onClose={() => setSupply(null)}
              />
            </Window>
          </div>
          <div className="full">
            {markets.filter((m) => +borrowBalances[m.underlyingAddress] > 0)
              .length !== 0 && (
              <Window
                classes={{ title: 'second' }}
                labels={{ title: 'My Borrow Markets' }}
              >
                <table cellPadding={0} cellSpacing={0}>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>APY/Accrued</th>
                      <th>Balance</th>
                      <th>% Of Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markets
                      .filter((m) => +borrowBalances[m.underlyingAddress] > 0)
                      .map((market) => (
                        <BorrowMarket
                          isMyMarkets={true}
                          key={market.id}
                          market={market}
                          totalCash={totalCash}
                          borrowRatePerBlock={fromWei(
                            marketBorrowRates[market.underlyingAddress] || '0',
                            18
                          )}
                          balance={
                            borrowBalances[market.underlyingAddress] || '0'
                          }
                          onBorrow={() =>
                            setBorrow({ ...market, borrowBalance: -1 })
                          }
                        />
                      ))}
                  </tbody>
                </table>
              </Window>
            )}
            <Window
              classes={{ title: 'second' }}
              labels={{ title: 'Borrow Markets' }}
            >
              <table cellPadding={0} cellSpacing={0}>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>APY</th>
                    <th>Wallet</th>
                    <th>Liquidity</th>
                  </tr>
                </thead>
                <tbody>
                  {markets
                    .filter((m) => +borrowBalances[m.underlyingAddress] === 0)
                    .map((market) => (
                      <BorrowMarket
                        key={market.id}
                        market={market}
                        borrowRatePerBlock={fromWei(
                          marketBorrowRates[market.underlyingAddress] || '0',
                          18
                        )}
                        balance={
                          marketBalances[market.underlyingAddress] || '0'
                        }
                        onBorrow={() =>
                          setBorrow({ ...market, borrowBalance: -1 })
                        }
                      />
                    ))}
                </tbody>
              </table>
              {markets.filter((m) => +borrowBalances[m.underlyingAddress] === 0)
                .length === 0 && (
                <p className={`${styles.noMarkets} center`}>No Markets</p>
              )}
              <BorrowModal
                network={network}
                pending={borrow && requests.borrow === borrow.id}
                market={borrow}
                balance={
                  (borrow && borrowBalances[borrow.underlyingAddress]) || '0'
                }
                walletBalance={
                  (borrow && marketBalances[borrow.underlyingAddress]) || '0'
                }
                totalBorrow={totalBorrow}
                borrowLimit={
                  borrow &&
                  (Number(borrow.underlyingPriceUSD) > 0
                    ? totalCash / borrow.underlyingPriceUSD
                    : 0)
                }
                borrowRatePerBlock={
                  borrow &&
                  fromWei(
                    marketBorrowRates[borrow.underlyingAddress] || '0',
                    18
                  )
                }
                borrowLimitUsed={
                  totalCash > 0 ? (totalBorrow / totalCash) * 100 : 0
                }
                distributeApy={
                  (borrow &&
                    marketDistributeApys[borrow.underlyingAddress] &&
                    marketDistributeApys[borrow.underlyingAddress][0]) ||
                  '-'
                }
                disabled={borrow && transactionMap[1][borrow.id]}
                allowed={
                  borrow && marketAllowances[borrow.underlyingAddress] > 0
                }
                onSubmit={handleBorrowMarket}
                onClose={() => setBorrow(null)}
              />
            </Window>
          </div>
        </div>
      </section>
    </>
  )
}
