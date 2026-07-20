import type { BriefingMail } from "../types/story.types";
import styles from "./MailClient.module.css";

interface MailClientProps {
  mail: BriefingMail;
}

function MailClient({ mail }: MailClientProps) {
  return (
    <div className={styles.mail}>
      <div className={styles.headerRow}>
        <div>
          <span>Von:</span>
          {mail.from}
        </div>
        <div className={styles.subject}>{mail.subject}</div>
      </div>
      <div className={styles.body}>{mail.body}</div>
    </div>
  );
}

export default MailClient;
