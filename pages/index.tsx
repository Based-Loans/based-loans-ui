import Link from 'next/link';
import Button from 'components/Button/Button';
import styles from 'styles/Home.module.css';
import React from 'react';
import { 
  AUDIT_REPORT_URL, 
  DISCORD_URL, 
  ETHERSCAN_URL, 
  GITHUB_URL, 
  TELEGRAM_URL, 
  TWITTER_URL } 
from 'common/constants';



const Home = (props) => (
  <div className={`flex-column ${styles.container}`}>
    <Header />
    <ContentSection />
    <Footer />
  </div>
)
export default Home;



const Header = () => (
  <header className={styles.header}>
    <div className={styles.socials}>
      <HeaderLink href={AUDIT_REPORT_URL}>
        Audit Reports
      </HeaderLink>
      <HeaderLink href={ETHERSCAN_URL}>
        Etherscan
      </HeaderLink>
      <HeaderLink href={DISCORD_URL}>
        Discord
      </HeaderLink>
      <HeaderLink href={TWITTER_URL}>
        Twitter
      </HeaderLink>
      <HeaderLink href={TELEGRAM_URL}>
        Telegram
      </HeaderLink>
      <HeaderLink href={GITHUB_URL}>
        Github
      </HeaderLink>
    </div>
  </header>
)


const ContentSection = () => (
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
)


const Footer = () => (
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
          href={TELEGRAM_URL}
        >
          Live Chat
        </Button>
        <div className={styles.warning}>
          Warning: These are terrible people. Trust no one. We warned you.
        </div>
      </div>
    </div>
  </div>
)


const HeaderLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
  >
    {children}
  </a>
)