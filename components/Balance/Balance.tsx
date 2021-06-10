import { abbreviateNumberSI } from 'utils/number'
import styles from './Balance.module.css'

interface IBalance {
  totalSupply: number
  totalCash: number
  totalBorrow: number
  netAPY: number
}

export default function Balance({
  totalSupply,
  totalCash,
  totalBorrow,
  netAPY,
}: IBalance) {
  const borrowPercent = totalCash > 0 ? (totalBorrow / totalCash) * 100 : 0
  return (
    <div className={styles.balance}>
      <div className={`${styles.info} flex-center justify-around`}>
        <div className={styles.supply}>
          <span className={styles.label}>Supply Balance</span>
          <span className={styles.value}>
            ${abbreviateNumberSI(totalSupply, 7, 7)}
          </span>
        </div>
        <div className={`${styles.apy} flex-center justify-center center`}>
          <div className={styles.net}>
            <div className={styles.label}>NET APY</div>
            <div className={styles.value}>
              {netAPY !== 0 ? `${netAPY.toFixed(2)} %` : '...'}
            </div>
          </div>
        </div>
        <div className={styles.borrow}>
          <span className={styles.label}>Borrow Balance</span>
          <span className={styles.value}>
            ${abbreviateNumberSI(totalBorrow, 7, 7)}
          </span>
        </div>
      </div>
      <div className={`${styles.limit} flex-center`}>
        <span>
          Borrow Limit <b>{borrowPercent.toFixed(2)}%</b>
        </span>
        <div className={styles.status}>
          <span
            className={styles.bar}
            style={{ width: `${Math.min(borrowPercent, 100)}%` }}
          />
        </div>
        <span>${abbreviateNumberSI(totalCash, 2, 2)}</span>
      </div>
    </div>
  )
}
