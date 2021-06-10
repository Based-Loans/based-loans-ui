import Link from 'next/link'
import Button from 'components/Button/Button'
import styles from 'styles/Home.module.css'

export default function Home(props) {
  return (
    <div className={`flex-column ${styles.container}`}>
      <header className={styles.header}>
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
      </header>
      <div className={styles.content}>
        <img
          src="/assets/intro/based-loans-logo-art.png"
          className={styles.art}
        />
        <img src="/assets/intro/based-loans-logo.png" className={styles.logo} />
        <Link href="/app">
          <Button className={styles.button}>Launch</Button>
        </Link>
        <a
          href="/assets/based_loans.pdf"
          target="_blank"
          className={styles.ebook}
        >
          Get The FREE Based Loans eBook
        </a>
      </div>
      <div className={`flex-end justify-between ${styles.footer}`}>
        <div className={styles.copyRight}>
          Copyrights 1982. We may use cookies to enhance our meals. Terms don’t
          apply. When you party, you must party hard. This is for defi degens.
          Use at your own risk.
        </div>
        <div className={`flex ${styles.chatbox}`}>
          <img src="/assets/intro/rep.jpg" className={styles.art} />
          <div>
            <div className={styles.help}>NEED HELP?</div>
            <div className={styles.liveChat}>Call 1-800-614-1059</div>
            <div className={styles.liveChat}>or use 24/7 Live Chat</div>
            <Button
              className={styles.button}
              href="https://t.co/cp9ADiXFqo?amp=1"
            >
              Live Chat
            </Button>
            <div className={styles.warning}>
              Warning: These are terrible people. Trust no one. We warned you.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
