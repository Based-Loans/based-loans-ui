import { ReactNode, ReactNodeArray, useEffect, useState } from 'react'
import Button from 'components/Button/Button'
import styles from './Window.module.css'

interface Properties {
  [key: string]: string
}

interface IWindow {
  children: ReactNode | ReactNodeArray
  labels: Properties
  classes?: Properties
  onClose?: Function
  onLoad?: Function
}

export default function Window({
  children,
  classes = {},
  labels,
  onClose,
  onLoad,
}: IWindow) {
  const [open, setOpen] = useState(true)
  const handleControl = onClose || setOpen

  useEffect(() => {
    onLoad && onLoad()
  }, [])

  return (
    <div
      className={`${styles.window} ${classes.window || ''} window`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={`title-bar ${classes.title || ''}`}>
        <div className="title-bar-text">{labels.title}</div>
        <div className="title-bar-controls">
          {!open && (
            <Button aria-label="Maximize" onClick={() => handleControl(true)} />
          )}
          {open && (
            <Button aria-label="Close" onClick={() => handleControl(false)} />
          )}
        </div>
      </div>
      <div
        className={`${open ? styles.opened : styles.closed} ${
          classes.content || ''
        } window-content`}
      >
        {children}
      </div>
    </div>
  )
}
