import { AbstractControl, ValidatorFn } from '@angular/forms';

// Mobile-number rules per country dial code (see PHONE_VALIDATION_SPEC.md).
// min/max = digits of the national number WITHOUT the trunk 0. Mobile only, no landlines.
// Keep in sync with VaccineAPI/helper/PhoneRules.cs.
export interface PhoneRule {
  min: number;
  max: number;
  start?: string;   // regex source the national number must begin with
  trunk0?: boolean; // country writes a leading 0 domestically; strip one
}

export const PHONE_RULES: { [code: string]: PhoneRule } = {
  '92':  { min: 10, max: 10, start: '3', trunk0: true },
  '966': { min: 9,  max: 9,  start: '5', trunk0: true },
  '971': { min: 9,  max: 9,  start: '5', trunk0: true },
  '44':  { min: 10, max: 10, start: '7', trunk0: true },
  '1':   { min: 10, max: 10 },
  '974': { min: 8,  max: 8 },
  '965': { min: 8,  max: 8 },
  '968': { min: 8,  max: 8 },
  '973': { min: 8,  max: 8 },
  '60':  { min: 9,  max: 10, trunk0: true },
  '61':  { min: 9,  max: 9,  start: '4', trunk0: true },
  '49':  { min: 10, max: 11, trunk0: true },
  '39':  { min: 9,  max: 10 },
  '33':  { min: 9,  max: 9,  trunk0: true },
  '34':  { min: 9,  max: 9 },
  '31':  { min: 9,  max: 9,  trunk0: true },
  '47':  { min: 8,  max: 8 },
  '46':  { min: 7,  max: 10, trunk0: true },
  '45':  { min: 8,  max: 8 },
  '353': { min: 9,  max: 9,  trunk0: true },
  '32':  { min: 9,  max: 9,  trunk0: true },
  '30':  { min: 10, max: 10 },
  '90':  { min: 10, max: 10, trunk0: true },
  '86':  { min: 11, max: 11 },
  '81':  { min: 10, max: 10, trunk0: true },
  '82':  { min: 9,  max: 10, trunk0: true },
  '852': { min: 8,  max: 8 },
  '65':  { min: 8,  max: 8 },
  '93':  { min: 9,  max: 9,  trunk0: true },
  '91':  { min: 10, max: 10, trunk0: true },
  '880': { min: 10, max: 10, trunk0: true },
  '98':  { min: 10, max: 10, trunk0: true },
  '27':  { min: 9,  max: 9,  trunk0: true },
  '64':  { min: 8,  max: 10, trunk0: true },
};

// Any country not in the table: E.164 range.
const FALLBACK: PhoneRule = { min: 6, max: 15 };

// "1-684" style codes (NANP territories) share dial code 1.
export function dialKey(cc: any): string {
  return String(cc == null ? '' : cc).split('-')[0].replace(/\D/g, '');
}

export function ruleFor(cc: any): PhoneRule {
  return PHONE_RULES[dialKey(cc)] || FALLBACK;
}

// Strip spaces/dashes, +/00 prefix, a typed country code and the trunk 0.
export function normalizePhone(cc: any, raw: any): string {
  const key = dialKey(cc);
  const rule = ruleFor(cc);
  let v = String(raw == null ? '' : raw).replace(/[\s\-().]/g, '');
  let hadPrefix = false;
  if (v.indexOf('+') === 0) { v = v.substring(1); hadPrefix = true; }
  else if (v.indexOf('00') === 0) { v = v.substring(2); hadPrefix = true; }
  if (key && v.indexOf(key) === 0 && (hadPrefix || v.length > rule.max)) {
    v = v.substring(key.length);
  }
  if (rule.trunk0 && v.indexOf('0') === 0) {
    v = v.substring(1);
  }
  return v;
}

// null when valid, otherwise the message to show.
export function phoneError(cc: any, raw: any): string | null {
  const v = normalizePhone(cc, raw);
  if (!v) { return null; }
  const rule = ruleFor(cc);
  const key = dialKey(cc);
  if (!/^\d+$/.test(v)) { return 'Mobile number must contain digits only.'; }
  if (v.length < rule.min || v.length > rule.max) {
    const len = rule.min === rule.max ? 'exactly ' + rule.min : rule.min + ' to ' + rule.max;
    return 'Mobile number for +' + key + ' must be ' + len + ' digits' +
      (key === '92' ? ' (e.g. 3001234567).' : '.');
  }
  if (rule.start && !new RegExp('^' + rule.start).test(v)) {
    return key === '92'
      ? 'Pakistani mobile numbers start with 3 (e.g. 3001234567).'
      : 'Mobile number for +' + key + ' is not a valid mobile number.';
  }
  return null;
}

// ccControlName: sibling control holding the dial code; fixedCc used when the form has none.
export function phoneValidator(ccControlName?: string, fixedCc?: string): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    let cc: any = fixedCc || '92';
    if (ccControlName) {
      if (!control.parent) { return null; }
      const c = control.parent.get(ccControlName);
      if (c && c.value) { cc = c.value; }
    }
    const msg = phoneError(cc, control.value);
    return msg ? { phoneInvalid: msg } : null;
  };
}
