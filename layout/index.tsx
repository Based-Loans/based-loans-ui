import React, { useReducer, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Collapse } from 'react-collapse'
import useWallet from 'hooks/useWallet'
import Account from 'components/Account/Account'
import { reducer, initState } from './store'
import styles from './Layout.module.css'
import useTicker from 'hooks/useTicker'
import { accountBalance } from 'utils/library'

const FETCH_TIME = 15
let balanceTimer = null

const networkLabels = {
  1: 'Ethereum Network',
  4: 'Rinkeby Testnet',
  3: 'Ropsten Testnet',
  5: 'Goreli Testnet',
  42: 'Kovan Testnet',
  56: 'Binance Network',
  97: 'Binance Testnet',
  137: 'Matic Network',
}

function detectHeaderPosition() {
  const main = window.scrollY
  const header = document.querySelector(`.${styles.header}`)
  if (!header) return
  const popup = document.querySelector(`.${styles.popup}`)
  const isOver = header.classList.contains(styles.hidden)
  const maxFix = header['offsetHeight'] * 1.5
  if (!isOver && main > maxFix) {
    header.classList.add(styles.hidden)
    popup['style'].top = '0'
  }
  if (isOver && main < maxFix) {
    header.classList.remove(styles.hidden)
    popup['style'].top = '-100%'
  }
}

function getTimer(now, start) {
  function withZero(v) {
    return v < 10 ? `0${v}` : v
  }
  const seconds = Math.floor((start.getTime() - now) / 1000)
  const hh = Math.floor(seconds / (60 * 60))
  const mm = Math.floor((seconds - hh * 60 * 60) / 60)
  const ss = seconds - hh * 60 * 60 - mm * 60
  return `${withZero(hh)}:${withZero(mm)}:${withZero(ss)}`
}

export default function Layout({
  children,
  router: { route },
  markets,
  networks,
}) {
  const router = useRouter()
  const [now] = useTicker()
  const [state, dispatch] = useReducer(reducer, initState)
  const [loading, connectWallet, library] = useWallet(dispatch, markets)
  const [restored, setRestored] = useState(false)
  const [isCollapse, setIsCollapse] = useState(false)
  const netMarkets = (library && markets[library.wallet.network]) || []

  useEffect(() => {
    window.addEventListener('scroll', detectHeaderPosition)
    return () => window.removeEventListener('scroll', detectHeaderPosition)
  }, [])

  useEffect(() => {
    if (route !== '/' && !library) {
      connectWallet()
    }
    setIsCollapse(false)
  }, [route, library])

  const getBalance = () => {
    accountBalance(library, dispatch)
  }

  useEffect(() => {
    if (library && state.account.address) {
      if (balanceTimer) clearInterval(balanceTimer)
      balanceTimer = setInterval(getBalance, FETCH_TIME * 1000)
      getBalance()
    }
    return () => balanceTimer && clearInterval(balanceTimer)
  }, [library, state.account.address])

  const checkTransactions = () => {
    const { transactions } = state
    Promise.all(
      transactions.map(
        (transaction) =>
          new Promise((resolve) => {
            library.web3.eth
              .getTransactionReceipt(transaction[0])
              .then(() => resolve(transaction[0]))
              .catch(() => resolve(transaction[0]))
          })
      )
    ).then((receipts) => {
      dispatch({
        type: 'txHash',
        payload: [receipts.filter((hash) => hash), true],
      })
    })
  }

  useEffect(() => {
    if (!restored && library) {
      setRestored(true)
      checkTransactions()
    }
  }, [library, state.transactions, state.account.address])

  return (
    <>
      <Head>
        <title>Based Loans</title>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <link
          href="https://necolas.github.io/normalize.css/latest/normalize.css"
          rel="stylesheet"
          type="text/css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {route === '/' ? (
        children
      ) : (
        <main className={`${styles.main} flex-column`}>
          <header className={styles.header}>
            <div className="relative">
              {state.startTime && state.startTime.getTime() > now && (
                <div className={styles.global}>
                  {getTimer(now, state.startTime)} left until Token Distribution
                </div>
              )}
              {library &&
                library.wallet.network !== 1 &&
                library.wallet.network !== 137 && (
                  <div className={styles.note}>
                    Note: You are currently connected to{' '}
                    {networkLabels[library.wallet.network] || 'Unknown'}
                  </div>
                )}
            </div>
            <div className="flex-center justify-between limited">
              <Link href="/">
                <img
                  className={`${styles.logo} cursor`}
                  src="/logo.png"
                  alt="Based Loans"
                />
              </Link>
              <div className={`flex ${styles.menu}`}>
                <Link href="/app">
                  <div
                    className={
                      router.pathname === '/app' ? styles.activeMenu : ''
                    }
                  >
                    Dashboard
                  </div>
                </Link>
                <Link href="/farms">
                  <div
                    className={
                      router.pathname === '/farms' ? styles.activeMenu : ''
                    }
                  >
                    Token Distribution
                  </div>
                </Link>
                <a href="https://sybil.based.loans" target="_blank">
                  Governance
                </a>
              </div>
              <div className={styles.mobileMenu}>
                <div className={styles.collapseContent} id="collapse-content">
                  <Collapse isOpened={isCollapse}>
                    <div className={`${styles.menuContent} flex-all`}>
                      <Link href="/app">
                        <div
                          className={
                            router.pathname === '/app' ? styles.activeMenu : ''
                          }
                        >
                          Dashboard
                        </div>
                      </Link>
                      <Link href="/farms">
                        <div
                          className={
                            router.pathname === '/farms'
                              ? styles.activeMenu
                              : ''
                          }
                        >
                          Token Distribution
                        </div>
                      </Link>
                      <a href="https://sybil.based.loans" target="_blank">
                        Governance
                      </a>
                    </div>
                  </Collapse>
                </div>
              </div>
              <Account
                library={library}
                {...state}
                loading={loading}
                dispatch={dispatch}
                connectWallet={connectWallet}
              />
              <img
                src="/assets/menu.svg"
                className={`${styles.hamburger} cursor`}
                alt="menu"
                onClick={() => setIsCollapse(!isCollapse)}
              />
            </div>
          </header>
          <header className={styles.popup}>
            <div className="flex-center justify-between limited">
              <Link href="/">
                <img
                  className={`${styles.logo} cursor`}
                  src="/logo.png"
                  alt="Based Loans"
                />
              </Link>
              {state.account && state.account.address && (
                <div className="account">{`${state.account.address.substr(
                  0,
                  6
                )}...${state.account.address.substr(-4, 4)}`}</div>
              )}
            </div>
          </header>
          {library && networks.includes(state.account.network) ? (
            React.cloneElement(children, {
              state,
              dispatch,
              library,
              markets: netMarkets,
              networks,
            })
          ) : (
            <div className={styles.invalidNetwork}>
              Please connect to the supported networks (
              {networks.map((network) => networkLabels[network]).join(', ')})
            </div>
          )}
          <footer className={`limited ${styles.footer}`}>
            <div className={styles.socials}>
              <a
                href="https://code423n4.com/reports/2021-04-basedloans"
                target="_blank"
                rel="noopener noreferrer"
              >
                Audit Reports
              </a>
              <a
                href="https://etherscan.io/token/0x68481f2c02be3786987ac2bc3327171c5d05f9bd"
                target="_blank"
                rel="noopener noreferrer"
              >
                Etherscan
              </a>
              <a
                href="https://discord.gg/H44DWX48Ra"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </a>
              <a
                href="https://twitter.com/basedloans"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </a>
              <a
                href="https://t.me/basedmoney"
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
              <a
                href="https://github.com/Based-Loans"
                target="_blank"
                rel="noopener noreferrer"
              >
                Github
              </a>
            </div>
          </footer>
        </main>
      )}
    </>
  )
}
