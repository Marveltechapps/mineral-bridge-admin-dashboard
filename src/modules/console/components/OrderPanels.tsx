import { sx } from '../../../lib/sx';
import type { ActionVM, NegotiationVM, OrderDetailVM } from '../../../types/console';
import { ActionButtons } from './ActionButton';
import styles from './OrderDetail.module.css';

/** What Mineral Bridge (or the customer) has to do next, with the inputs and buttons for it. */
export function NextStepCard({ next }: { next: OrderDetailVM['next'] }) {
  return (
    <div className={`${styles.card} ${styles.next}`}>
      <span className={styles.eyebrow}>NEXT STEP</span>
      <span className={styles.nextTitle}>{next.title}</span>
      <div className={styles.nextPills}>
        <span style={sx(next.toneStyle)}>{next.owner}</span>
        {next.hasRole && <span className={styles.rolePill}>{next.role}</span>}
      </div>
      <span style={sx(next.ageStyle)}>{next.age}</span>
      {next.hasNote && <span className={styles.nextNote}>{next.note}</span>}
      {next.hasFields && (
        <div className={styles.fields}>
          {next.fields.map((f, i) => (
            <label key={i} className={styles.field}>
              <span className={styles.fieldLabel}>{f.label}</span>
              {f.isText && <input defaultValue={f.value} onChange={f.set} className={styles.input} />}
              {f.isChoice && (
                <span className={styles.choices}>
                  {(f.choices || []).map((o, oi) => <button type="button" key={oi} onClick={o.go} style={sx(o.style)}>{o.label}</button>)}
                </span>
              )}
            </label>
          ))}
        </div>
      )}
      <div className={styles.acts}><ActionButtons actions={next.acts} /></div>
      <span className={styles.signedAs}>{next.signedAs}</span>
    </div>
  );
}

/** Price negotiation thread with the customer, with counter-offer input. */
export function NegotiationCard({ nego }: { nego: NegotiationVM }) {
  return (
    <div className={`${styles.card} ${styles.nego}`}>
      <div className={styles.negoHead}><span className={styles.eyebrow}>PRICE NEGOTIATION</span><span className={styles.negoCount}>{nego.count}</span></div>
      <span className={styles.negoCurrent}>{nego.current}</span>
      <div className={styles.negoMsgs}>
        {nego.msgs.map((m, i) => (
          <div key={i} style={sx(m.wrap)}>
            <div style={sx(m.bubble)}><span>{m.text}</span>{m.hasOffer && <span style={sx(m.offerStyle)}>{m.offer}</span>}</div>
            <span style={sx(m.metaStyle)}>{m.meta}</span>
          </div>
        ))}
        {nego.empty && <span className={styles.negoEmpty}>No messages yet.</span>}
      </div>
      <textarea rows={2} defaultValue="" onChange={nego.setText} placeholder="Message to the customer" aria-label="Message to the customer" className={styles.negoText} />
      <input defaultValue="" onChange={nego.setOffer} placeholder={nego.offerHint} aria-label={nego.offerHint} inputMode="decimal" className={styles.input} />
      <div className={styles.negoActs}><ActionButtons actions={nego.acts} /></div>
    </div>
  );
}

export function CustomerCard({ cust }: { cust: OrderDetailVM['cust'] }) {
  return (
    <button type="button" onClick={cust.go} className={`${styles.card} ${styles.customer}`}>
      <span className={styles.eyebrow}>CUSTOMER</span>
      <span className={styles.customerName}>{cust.name}</span>
      <span className={styles.customerBiz}>{cust.business} · {cust.country}</span>
      <span className={styles.customerContact}>{cust.contact}</span>
      {/* The status is its own flex item inside the pill, so the pill reads "KYC" + status with no gap, as the design draws it. */}
      <span style={sx(cust.kycStyle)}>KYC <span>{cust.kyc}</span></span>
    </button>
  );
}

export function ManageCard({ actions }: { actions: ActionVM[] }) {
  return (
    <div className={`${styles.card} ${styles.manage}`}>
      <span className={styles.eyebrow}>MANAGE RECORD</span>
      <ActionButtons actions={actions} />
    </div>
  );
}
