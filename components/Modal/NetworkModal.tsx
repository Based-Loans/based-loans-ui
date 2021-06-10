import { netLabels } from 'components/Account/Account'
import Modal from './Modal'
import styles from './Modal.module.css'

interface INetworkModal {
  show: boolean
  network: number
  current: number
  onNetwork: Function
  onClose: Function
  closeOnEscape?: boolean
}

export default function NetworkModal({
  show,
  network,
  current,
  onNetwork,
  onClose,
  closeOnEscape,
}: INetworkModal) {
  const logos = {
    1: 'eth',
    4: 'eth',
    137: 'matic',
  }

  return (
    <Modal
      show={show}
      title="Information"
      onRequestClose={onClose}
      closeOnEscape={closeOnEscape}
      loading
    >
      <div className={styles.networks}>
        <p className="center">Switch Network</p>
        {network !== current && [1, 4].includes(network) && (
          <div className={styles.invalid}>
            App network (<b>{netLabels[network] || 'Unknown'}</b>) doesn't mach
            to network selected in wallet:{' '}
            <b>{netLabels[current] || 'Unknown'}</b>
          </div>
        )}
        <div className="flex justify-center">
          <div className={styles.network}>
            <img
              className={styles.netowrkIcon}
              src={`/assets/networks/${logos[1]}.png`}
              onClick={() => onNetwork(1)}
            />
            {[1, 4].includes(network) && (
              <img
                className={styles.selectedNetwork}
                src="/assets/networks/check.uu"
              />
            )}
          </div>
          <div className={styles.network}>
            <img
              className={styles.tokenIcon}
              src={`/assets/networks/${logos[137]}.png`}
              onClick={() => onNetwork(137)}
            />
            {[137].includes(network) && (
              <img
                className={styles.selectedNetwork}
                src="/assets/networks/check.uu"
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
