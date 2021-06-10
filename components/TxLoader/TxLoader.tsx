import Button from 'components/Button/Button'
import { getEtherscan } from 'utils/links'
import styles from './TxLoader.module.css'

interface ITxLoader {
  hash?: string
  network?: number
}

const scanLabels = {
  1: 'Etherscan',
  4: 'Etherscan',
  56: 'Bscscan',
  97: 'Bscscan',
  137: 'Maticscan',
}

export default function TxLoader({ hash, network }: ITxLoader) {
  const text = hash ? 'Transaction pending...' : 'Waiting confirmation...'
  return (
    <div className={styles.loader}>
      <p>{text}</p>
      <img src="/assets/loading.gif" />
      {hash && <Button href={getEtherscan(hash, network)} className="padded">View on {scanLabels[network] || 'Etherscan'}</Button>}
    </div>
  )
}
