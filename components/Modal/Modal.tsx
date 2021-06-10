import { ReactNode, ReactNodeArray, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import Window from 'components/Window/Window'
import styles from './Modal.module.css'

interface IModal {
  loading?: boolean
  children: ReactNode | ReactNodeArray
  title: string
  show: boolean
  onRequestClose?: Function
  closeOnEscape?: boolean
  extra?: ReactNode | ReactNodeArray
  className?: string
}

export default function Modal({
  loading = false,
  children,
  title,
  show,
  onRequestClose,
  closeOnEscape = true,
  extra = null,
  className = '',
}: IModal) {
  const [loaded, setLoaded] = useState(false)
  function handleKeyUp(e) {
    if (e.key === 'Escape') onRequestClose && onRequestClose()
  }
  useEffect(() => {
    closeOnEscape && window.addEventListener('keyup', handleKeyUp)
    setLoaded(true)
    return () =>
      closeOnEscape && window.removeEventListener('keyup', handleKeyUp)
  }, [])
  if (!loaded) return null
  return ReactDOM.createPortal(
    <div
      className={`${styles.overlay} ${show ? styles.show : styles.hide}`}
      onMouseDown={() => onRequestClose && onRequestClose()}
    >
      <div className={styles.wrapper}>
        <Window
          labels={{ title }}
          onClose={onRequestClose}
          classes={{
            window: `${styles.window} ${className}`,
            content: loading ? styles.loading : styles.content,
          }}
        >
          {children}
        </Window>
        {extra}
      </div>
    </div>,
    document.body
  )
}
