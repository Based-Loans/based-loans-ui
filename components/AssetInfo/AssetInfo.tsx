import { abbreviateNumberSI } from "utils/number"
import styles from "./AssetInfo.module.css"

interface IAssetInfo {
  infoType: string
  assetUrl: string
  isBorrowLimitInfo?: boolean
  apy?: string
  borrowBalance?: number
  borrowLimit?: number
  borrowLimitUsed?: number
  distributeApy?: string
}

export default function AssetInfo({
  infoType = "supply",
  assetUrl,
  isBorrowLimitInfo = true,
  apy = '0',
  borrowBalance = 0,
  borrowLimit = 0,
  borrowLimitUsed = 0,
  distributeApy
}: IAssetInfo) {
  return (
    <div className={styles.assetInfo}>
      <div className={styles.apySection}>
        <span className={styles.label}>
          {infoType === "supply" ? "Supply" : "Borrow"} Rates
        </span>
        <div className={`${styles.info} flex justify-between`}>
          <div className="flex-center">
            <img src={assetUrl} alt="asset" />
            <span>{infoType === "supply" ? "Supply" : "Borrow"} APY</span>
          </div>
          <span>{Number(apy || 0).toFixed(2)}%</span>
        </div>
        <div className={`${styles.info} flex justify-between`}>
          <div className="flex-center">
            <img src="/assets/token.png" alt="asset" />
            <span>Distribution APY</span>
          </div>
          <span>{distributeApy ? Number(distributeApy).toFixed(2) : '-' }%</span>
        </div>
      </div>
      {isBorrowLimitInfo && (
        <div className={styles.borrowSection}>
          <span className={styles.label}>Borrow Limit</span>
          <div className={`${styles.info} flex justify-between`}>
            <span>
              {infoType === "supply" ? "Borrow Limit" : "Borrow Balance"}
            </span>
            <span>
              $
              {infoType === "supply"
                ? (borrowLimit || 0).toFixed(2)
                : abbreviateNumberSI(borrowBalance, 7, 7)}
            </span>
          </div>
          <div className={`${styles.info} flex justify-between`}>
            <span>Borrow Limit Used</span>
            <span>{(borrowLimitUsed || 0).toFixed(2)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
