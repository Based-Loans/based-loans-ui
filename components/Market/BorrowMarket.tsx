import BigNumber from 'bignumber.js'
import { abbreviateNumberSI } from 'utils/number'
import styles from './Market.module.css'

interface IBorrowMarket {
  isMyMarkets?: boolean
  market: any
  balance: string
  totalCash?: number
  borrowRatePerBlock: number
  onBorrow: Function
}

export default function BorrowMarket({
  isMyMarkets,
  market,
  balance,
  totalCash,
  borrowRatePerBlock,
  onBorrow,
}: IBorrowMarket) {
  const blocksPerDay = 4 * 60 * 24
  const daysPerYear = 365

  return (
    <tr
      className={`${styles.market} ${styles.supply}`}
      onClick={() => onBorrow()}
    >
      <td className="flex-center">
        <div className={styles.logo}>
          <img
            src={`/assets/cryptologos/${market.underlyingSymbol
              .split(' ')[0]
              .toLowerCase()}.${
              ['BLO', 'DPI', 'AKITA', 'ELON', 'KISHU', 'SHIB', 'TNT'].includes(market.underlyingSymbol) ? 'png' : 'svg'
            }`}
          />
        </div>{' '}
        {market.underlyingSymbol}
      </td>
      <td>
        <p>
          {new BigNumber(borrowRatePerBlock * blocksPerDay + 1)
            .pow(daysPerYear)
            .minus(1)
            .times(100)
            .dp(2, 1)
            .toString(10)}
          %
        </p>
        {isMyMarkets && <p className={styles.textOpacity}>TBD</p>}
      </td>
      <td>
        {isMyMarkets && (
          <p>
            $
            {abbreviateNumberSI(
              Number(balance) * market.underlyingPriceUSD,
              0,
              2,
              market.underlyingDecimals
            )}
          </p>
        )}
        <p className={isMyMarkets ? styles.textOpacity : ''}>
          {Number(balance).toFixed(2)} {market.underlyingSymbol}
        </p>
      </td>
      <td>
        {isMyMarkets && (
          <div className="flex-center justify-end">
            <div className={styles.progress}>
              <div
                style={{
                  width:
                    30 *
                    ((Number(balance) * market.underlyingPriceUSD) / totalCash),
                }}
                className={styles.percent}
              />
            </div>
            {(totalCash > 0
              ? (Number(balance) * market.underlyingPriceUSD * 100) / totalCash
              : 0
            ).toFixed(2)}
            %
          </div>
        )}
        {!isMyMarkets && (
          <p>
            $
            {abbreviateNumberSI(
              Number(market.cash) * market.underlyingPriceUSD,
              0,
              2,
              market.underlyingDecimals
            )}
          </p>
        )}
      </td>
    </tr>
  )
}
