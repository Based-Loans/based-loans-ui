import BigNumber from 'bignumber.js'
import { toNumber } from 'utils/common'
import { addresses, ZERO } from 'utils/constants'

const links = {
  1: 'https://api.thegraph.com/subgraphs/name/based-loans/based-loans',
  4: 'https://api.thegraph.com/subgraphs/name/based-loans/rinkeby-based-loans',
  137: 'https://api.thegraph.com/subgraphs/name/based-loans/polygon-based-loans',
}
function getSubGraph(network) {
  if (!links[network]) return Promise.resolve([])
  return fetch(links[network], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query marketsQuery {
          markets(first: 20) {
            id
            borrowRate
            cash
            collateralFactor
            exchangeRate
            interestRateModelAddress
            name
            reserves
            supplyRate
            symbol
            totalBorrows
            totalSupply
            underlyingName
            underlyingAddress
            underlyingPrice
            underlyingSymbol
            underlyingPriceUSD
            underlyingDecimals
            accrualBlockNumber
            blockTimestamp
            borrowIndex
            reserveFactor
          }
        }
      `,
    }),
  })
    .then((response) => response.json())
    .then(({ data: { markets } }) =>
      markets
        .filter((marekt) => network !== 137 || marekt.accrualBlockNumber)
        .map(({ name, underlyingSymbol, ...item }) => ({
          ...item,
          name: name.replace('Based Loans', '').trim(),
          underlyingSymbol: underlyingSymbol.replace('(rinkeby)', '').trim(),
        }))
        .map(({ id, name, ...item }) => ({
          ...item,
          name,
          id:
            name === 'MATIC'
              ? '0xef8DC239a8977cc273990aa7A0046B7292d131f6'
              : id,
          weight: marketWeight[item.underlyingSymbol],
        }))
        .sort(
          (a, b) =>
            marketWeight[a.underlyingSymbol] - marketWeight[b.underlyingSymbol]
        )
    )
}

const marketWeight = {
  ETH: 1,
  MATIC: 1,
  USDC: 2,
  USDT: 3,
  WBTC: 4,
  DPI: 11,
  SHIB: 12,
  KISHU: 13,
  ELON: 14,
  AKITA: 15,
}

export function getMarkets(network?: number) {
  return network
    ? getSubGraph(network)
    : Promise.all([getSubGraph(1), getSubGraph(4), getSubGraph(137)])
}

export function updateMarketCash(library, callback) {
  if (!library || !library.initiated) return
  const fromWei = (value, decimals = 18) =>
    decimals < 18
      ? new BigNumber(value).div(10 ** decimals).toString(10)
      : library.web3.utils.fromWei(value)
  const network = library.wallet.network
  getMarkets(network)
    .then((markets) => {
      if (network !== library.wallet.network) return
      Promise.all(
        markets.map((market) => {
          const bTokenMethods = library.methods.BToken(library.BToken(market))
          return Promise.all([
            Promise.resolve(market),
            bTokenMethods ? bTokenMethods.getCash() : Promise.resolve('0'),
          ])
        })
      )
        .then((cashes) => {
          if (network !== library.wallet.network) return
          callback(
            cashes.map(([market, cash]) => ({
              ...market,
              cash: fromWei(cash, market.underlyingDecimals),
            }))
          )
        })
        .catch((err) => {
          console.log('getMarketCashes', err)
        })
    })
    .catch((err) => console.log('getMarkets', err))
}

export function accountBalance(library, dispatch) {
  if (!library || !library.initiated) return
  const account = library.wallet.address
  const fromWei = (value, decimals = 18) =>
    decimals < 18
      ? new BigNumber(value).div(10 ** decimals).toString(10)
      : library.web3.utils.fromWei(value)
  if (!addresses[library.wallet.network]) {
    return
  }
  const bloMarket = library.markets.find((m) => m.underlyingSymbol === 'BLO')
  const network = library.wallet.network
  Promise.all([
    fetch('https://api.coingecko.com/api/v3/coins/based-loans-ownership').then(
      (resp) => resp.json()
    ),
    library.methods.Comptroller.getAssetsIn(account),
    library.web3.eth.getBalance(account),
    // library.methods.Comptroller.compAccrued(account),
    // library.methods.Comp.balanceOf(account),
    library.methods.CompoundLens.getCompBalanceMetadataExt(account),
    new Promise((resolve) => {
      if (addresses[library.wallet.network].Farms.length > 0) {
        const farm = addresses[library.wallet.network].Farms[0]
        const farming = library.Farm(farm)
        if (!farming) return resolve(new Date('2021-04-19 01:00+0'))
        const farmMethods = library.methods.Farm(farming.farmContract)
        farmMethods
          .startTime()
          .then((time) => resolve(new Date(time * 1000)))
          .catch(() => resolve(new Date('2021-04-19 01:00+0')))
      } else resolve(new Date('2021-04-19 01:00+0'))
    }),
    Promise.all(
      addresses[library.wallet.network].Farms.map((farm) => {
        const { underlyingAddress: address } = farm
        const farming = library.Farm(farm)
        if (!farming) return Promise.resolve(new Array(4).fill(['0']))
        const tokenMethods =
          farming && library.methods.Market(farming.tokenContract)
        const farmMethods =
          farming && library.methods.Farm(farming.farmContract)

        return tokenMethods && farmMethods
          ? Promise.all([
              address !== ZERO
                ? tokenMethods.getBalance(account)
                : Promise.resolve('0'),
              address !== ZERO
                ? tokenMethods.getAllowance(
                    account,
                    library.web3.utils.toChecksumAddress(farm.contractAddress)
                  )
                : Promise.resolve('0'),
              address !== ZERO
                ? farmMethods.getBalance(account)
                : Promise.resolve('0'),
              address !== ZERO
                ? farmMethods.getRewardBalance(account)
                : Promise.resolve('0'),
            ])
          : Promise.resolve(new Array(4).fill(['0']))
      })
    ),
    Promise.all(
      library.markets.map((market) => {
        const { underlyingAddress: address } = market
        const marketMethods = library.methods.Market(library.Market(market))
        const bTokenMethods = library.methods.BToken(library.BToken(market))

        return marketMethods && bTokenMethods
          ? Promise.all([
              address !== ZERO
                ? marketMethods.getBalance(account)
                : Promise.resolve('0'),
              address !== ZERO
                ? marketMethods.getAllowance(
                    account,
                    library.web3.utils.toChecksumAddress(market.id)
                  )
                : Promise.resolve('0'),
              bTokenMethods.balanceOfUnderlying(account),
              bTokenMethods.borrowBalanceCurrent(account),
              bTokenMethods.supplyRatePerBlock(),
              bTokenMethods.borrowRatePerBlock(),
              library.methods.Comptroller.compSpeeds(
                library.web3.utils.toChecksumAddress(market.id)
              ),
            ])
          : Promise.resolve(new Array(7).fill(['0']))
      })
    ),
  ])
    .then(
      ([
        bloData,
        assetsIn,
        _balance,
        // _rewardBalance,
        // _bloBalance,
        metadata,
        startTime,
        _farms,
        _markets,
      ]) => {
        const bloPrice = bloData.market_data
          ? bloData.market_data.current_price.usd
          : 0

        if (network !== library.wallet.network) return
        const balance = toNumber(fromWei(_balance))
        const rewardBalance = toNumber(fromWei(metadata.allocated))
        const bloBalance = toNumber(fromWei(metadata.balance))
        const marketBalances = {}
        const marketAllowances = {}
        const supplyBalances = {}
        const borrowBalances = {}
        const marketSupplyRates = {}
        const marketBorrowRates = {}
        const marketDistributeApys = {}

        const farmBalances = {}
        const farmAllowances = {}
        const stakedBalances = {}
        const rewardBalances = {}

        let totalSupply = new BigNumber(0)
        let totalCash = new BigNumber(0)
        let supplyEarning = new BigNumber(0)
        let totalBorrow = new BigNumber(0)
        let borrowEarning = new BigNumber(0)
        let totalBloSupplyEarning = new BigNumber(0)
        let totalBloBorrowEarning = new BigNumber(0)
        let netApy = new BigNumber(0)
        const blocksPerDay = 4 * 60 * 24
        const daysPerYear = 365

        const toChecksumAddress =
          library && library.web3.utils.toChecksumAddress

        addresses[library.wallet.network].Farms.map((farm, idx) => {
          const { underlyingAddress: address } = farm
          farmBalances[address] =
            address !== ZERO
              ? fromWei(_farms[idx][0], farm.underlyingDecimals)
              : balance
          farmAllowances[address] =
            address !== ZERO
              ? Number(fromWei(_farms[idx][1], farm.underlyingDecimals))
              : Number.POSITIVE_INFINITY
          stakedBalances[address] =
            address !== ZERO
              ? fromWei(_farms[idx][2], farm.underlyingDecimals)
              : balance
          rewardBalances[address] =
            address !== ZERO ? fromWei(_farms[idx][3], 18) : balance
        })

        library.markets.forEach((market, idx) => {
          const { underlyingAddress: address, underlyingPriceUSD: price } =
            market
          marketBalances[address] =
            address !== ZERO
              ? fromWei(_markets[idx][0], market.underlyingDecimals)
              : balance
          marketAllowances[address] =
            address !== ZERO
              ? Number(fromWei(_markets[idx][1], market.underlyingDecimals))
              : Number.POSITIVE_INFINITY
          supplyBalances[address] = fromWei(
            _markets[idx][2],
            market.underlyingDecimals
          )
          totalSupply = totalSupply.plus(
            new BigNumber(supplyBalances[address]).times(price)
          )
          if (assetsIn.includes(toChecksumAddress(market.id))) {
            totalCash = totalCash.plus(
              new BigNumber(supplyBalances[address])
                .times(price)
                .times(market.collateralFactor)
            )
          }

          marketSupplyRates[address] = _markets[idx][4]
          marketBorrowRates[address] = _markets[idx][5]
          const supplyRatePerBlock = Number(
            new BigNumber(_markets[idx][4]).div(10 ** 18).toString(10)
          )
          const supplyApy = new BigNumber(supplyRatePerBlock * blocksPerDay + 1)
            .pow(daysPerYear)
            .minus(1)
            .times(100)
            .dp(2, 1)
            .toString(10)
          const borrowRatePerBlock = Number(
            new BigNumber(_markets[idx][5]).div(10 ** 18).toString(10)
          )
          const borrowApy = new BigNumber(borrowRatePerBlock * blocksPerDay + 1)
            .pow(daysPerYear)
            .minus(1)
            .times(100)
            .dp(2, 1)
            .toString(10)

          supplyEarning = supplyEarning.plus(
            new BigNumber(supplyBalances[address])
              .times(price)
              .times(supplyApy)
              .div(100)
          )
          borrowBalances[address] = fromWei(
            _markets[idx][3],
            market.underlyingDecimals
          )
          totalBorrow = totalBorrow.plus(
            new BigNumber(borrowBalances[address]).times(price)
          )
          borrowEarning = borrowEarning.plus(
            new BigNumber(borrowBalances[address])
              .times(price)
              .times(borrowApy)
              .div(100)
          )
          // Distribution APY Calculation
          const compSpeed = Number(
            new BigNumber(_markets[idx][6]).div(10 ** 18).toString(10)
          )
          const supplyBloApy =
            !compSpeed || totalSupply.isZero()
              ? '0'
              : new BigNumber(100)
                  .times(
                    new BigNumber(
                      new BigNumber(1).plus(
                        new BigNumber(bloMarket.underlyingPriceUSD || bloPrice)
                          .times(compSpeed)
                          .times(blocksPerDay)
                          .div(
                            new BigNumber(totalSupply)
                              .times(_markets[idx][6])
                              .times(price)
                          )
                      )
                    )
                      .pow(365)
                      .minus(1)
                  )
                  .toString(10)
          const borrowBloApy =
            !compSpeed || totalBorrow.isZero()
              ? '0'
              : new BigNumber(100)
                  .times(
                    new BigNumber(
                      new BigNumber(1).plus(
                        new BigNumber(bloMarket.underlyingPriceUSD || bloPrice)
                          .times(compSpeed)
                          .times(blocksPerDay)
                          .div(new BigNumber(totalBorrow).times(price))
                      )
                    )
                      .pow(365)
                      .minus(1)
                  )
                  .toString(10)
          totalBloSupplyEarning = totalBloSupplyEarning
            .plus(supplyBloApy)
            .times(totalSupply)
          totalBloBorrowEarning = totalBloBorrowEarning
            .plus(borrowBloApy)
            .times(totalBorrow)

          marketDistributeApys[address] = [supplyBloApy, borrowBloApy]
        })

        const totalEarning = new BigNumber(supplyEarning)
          .plus(totalBloSupplyEarning)
          .plus(totalBloBorrowEarning)
          .minus(borrowEarning)
        if (totalEarning.isGreaterThan(0)) {
          if (totalSupply.isGreaterThan(0))
            netApy = totalEarning.div(totalSupply).times(100)
        } else {
          if (totalBorrow.isGreaterThan(0))
            netApy = totalEarning.div(totalBorrow).times(100)
        }

        dispatch({
          type: 'balance',
          payload: {
            bloPrice,
            assetsIn,
            balance,
            rewardBalance,
            bloBalance,
            marketBalances,
            marketAllowances,
            marketSupplyRates,
            marketBorrowRates,
            marketDistributeApys,
            supplyBalances,
            borrowBalances,
            farmBalances,
            farmAllowances,
            stakedBalances,
            rewardBalances,
            totalSupply: totalSupply.toNumber(),
            totalCash: totalCash.toNumber(),
            totalBorrow: totalBorrow.toNumber(),
            netAPY: netApy.toNumber(),
            startTime,
          },
        })
        updateMarketCash(library, (markets) => library.updateMarkets(markets))
      }
    )
    .catch((err) => {
      console.log('accountBalance', err)
      setTimeout(() => accountBalance(library, dispatch), 250)
    })
}
