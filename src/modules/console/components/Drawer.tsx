import { useEffect, useState, type ChangeEvent } from 'react';
import { sx } from '../../../lib/sx';
import type { DrawerItemVM, DrawerVM, InputVM } from '../../../types/console';
import { ActionButtons } from './ActionButton';
import { Icon } from './Icon';
import styles from './Drawer.module.css';

function SectionItem({ item }: { item: DrawerItemVM }) {
  return (
    <div onClick={item.go} style={sx(item.style)}>
      {item.hasImg && <span style={sx(item.imgStyle)} />}
      {item.hasPh && <span className={styles.thumbPh}>{item.phText}</span>}
      <span className={styles.itemText}>
        <span className={styles.itemT}>{item.t}</span>
        <span className={styles.itemS}>{item.s}</span>
        {item.hasBtns && (
          <span className={styles.itemButtons}>
            {item.btns.map((b, i) => <button type="button" key={i} onClick={b.go} style={sx(b.style)}>{b.label}</button>)}
          </span>
        )}
      </span>
      <span style={sx(item.rStyle)}>{item.r}</span>
    </div>
  );
}

/** Controlled so typed values stay in form state even when the drawer view model is rebuilt. */
function DrawerInput({ field }: { field: InputVM }) {
  const [value, setValue] = useState(field.value);
  useEffect(() => { setValue(field.value); }, [field.value, field.label]);
  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value);
    field.set(e);
  };
  return (
    <label className={styles.input}>
      <span className={styles.inputLabel}>{field.label}</span>
      {field.isText && <input name={field.label} value={value} onChange={onChange} className={styles.textInput} />}
      {field.isArea && <textarea name={field.label} rows={5} value={value} onChange={onChange} className={styles.areaInput} />}
      {field.isChoice && (
        <span className={styles.choices}>
          {(field.choices || []).map((o, i) => <button type="button" key={i} onClick={o.go} style={sx(o.style)}>{o.label}</button>)}
        </span>
      )}
    </label>
  );
}

/** Right-hand drawer for any record: details, linked items, a reply box, edit inputs and actions. */
export function Drawer({ dw }: { dw: DrawerVM }) {
  return (
    <div className={styles.overlay}>
      <div onClick={dw.close} className={styles.backdrop} />
      <div key={dw.key} className={styles.panel} role="dialog" aria-label={dw.title}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <span style={sx(dw.pillStyle)}>{dw.pill}</span>
            <span className={styles.title}>{dw.title}</span>
            <span className={styles.sub}>{dw.sub}</span>
          </div>
          <button type="button" onClick={dw.close} aria-label="Close" className={styles.close}><Icon name="x" size={15} /></button>
        </div>
        <div className={styles.body}>
          {dw.hasPreview && (
            <>
              {dw.hasPreviewImg && <div style={sx(dw.previewStyle)} />}
              {dw.hasPreviewPh && <div className={styles.placeholder}>{dw.previewPh}</div>}
            </>
          )}
          {dw.hasFields && (
            <div className={styles.fields}>
              {dw.fields.map((f, i) => (
                <div key={i} className={styles.fieldRow}>
                  <span className={styles.fieldKey}>{f.k}</span>
                  <span className={styles.fieldVal}>{f.v}</span>
                </div>
              ))}
            </div>
          )}
          {dw.hasText && <pre className={styles.text}>{dw.text}</pre>}
          {dw.sections.map((s, si) => (
            <div key={si} className={styles.section}>
              <span className={styles.eyebrow}>{s.title}</span>
              {s.items.map((it, ii) => <SectionItem key={ii} item={it} />)}
            </div>
          ))}
          {dw.hasReply && (
            <div className={styles.reply}>
              <span className={styles.eyebrow}>REPLY</span>
              <div className={styles.saved}>
                {dw.replies.map((r, i) => <button type="button" key={i} onClick={r.go} className={styles.savedReply}>{r.label}</button>)}
              </div>
              <textarea rows={4} value={dw.replyText} onChange={dw.setReply} placeholder="Write to the customer…" aria-label="Reply to the customer" className={styles.replyText} />
            </div>
          )}
          {dw.hasInputs && (
            <div className={styles.inputs}>
              {dw.inputs.map((f, i) => <DrawerInput key={i} field={f} />)}
            </div>
          )}
        </div>
        <div className={styles.foot}><ActionButtons actions={dw.actions} /></div>
      </div>
    </div>
  );
}
