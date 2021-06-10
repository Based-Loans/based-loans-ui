import BigNumber from 'bignumber.js'
import Slider from 'components/Slider/Slider'
import { abbreviateNumberSI } from 'utils/number'
import styles from './Market.module.css'

interface ISupplyMarket {
  isMyMarkets?: boolean
  market: any
  balance: string
  assetsIn: string[]
  supplyRatePerBlock: number
  onSupply: Function
  onEnterMarket: Function
}

export default function SupplyMarket({
  isMyMarkets,
  market,
  balance,
  assetsIn,
  supplyRatePerBlock,
  onSupply,
  onEnterMarket,
}: ISupplyMarket) {
  const assetIn = assetsIn.some((item) => item.toLowerCase() === market.id)
  const blocksPerDay = 4 * 60 * 24
  const daysPerYear = 365
  return (
    <tr
      className={`${styles.market} ${styles.supply}`}
      onClick={() => onSupply()}
    >
      <td className="flex-center">
        <div className={styles.logo}>
          <img
            src={`/assets/cryptologos/${market.underlyingSymbol
              .split(' ')[0]
              .toLowerCase()}.${
              ['BLO', 'DPI', 'AKITA', 'ELON', 'KISHU', 'SHIB', 'TNT'].includes(
                market.underlyingSymbol
              )
                ? 'png'
                : 'svg'
            }`}
          />
        </div>{' '}
        {market.underlyingSymbol}
      </td>
      <td>
        <p>
          {new BigNumber(supplyRatePerBlock * blocksPerDay + 1)
            .pow(daysPerYear)
            .minus(1)
            .times(100)
            .dp(2, 1)
            .toString(10)}
          %
        </p>
        {isMyMarkets && (
          <p className={styles.textOpacity}>{market.underlyingSymbol}</p>
        )}
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
        {!new BigNumber(market.collateralFactor).isZero() && (
          <Slider value={assetIn} onChange={() => onEnterMarket(assetIn)} />
        )}
      </td>
    </tr>
  )
}
