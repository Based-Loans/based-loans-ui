import gql from 'graphql-tag'

export const marketsQuery = gql`
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
`
