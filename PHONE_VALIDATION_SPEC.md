# Phone Number Validation Spec (DRAFT, 2026-10-22)

## Locked decisions (owner)
1. Applies to EVERY place a phone number is entered or edited (not just registration).
2. Leading trunk `0` is stripped (e.g. +92 03001234567 -> 3001234567).
3. Table covers all countries that have mobile operators.
4. Mobile numbers only. No landlines.
5. Length is per country default: not less, not more.

## Rule
Given CountryCode `cc` and raw input:
1. Remove spaces and dashes. Strip leading `+` / `00`. Strip `cc` if typed. (Already done by `removeSpaces()` in child/add.)
2. Strip ONE leading `0` for countries that use a trunk 0 (table flag `trunk0`). Currently only done for 92.
3. Digits only.
4. Length must be within [min, max] from the table. Fixed countries have min = max (+92 = 10).
5. Optional prefix rule per country. +92: must start with `3` (mobile only, no landlines).

## Why a table, not a single number
Fixed 10: PK, IN, US/CA (NANP). Fixed 9: AE, SA. Variable: GB, DE, many others.
"Exactly N" is correct only where the national plan is fixed; elsewhere min != max.

## Enforcement points
- Client: shared validator (one file) used by every form below.
- Server: VaccineAPI rejects bad numbers on every write path (client-only check is bypassable and the Parent app / PA / imports write too).
- Existing stored numbers are grandfathered: validated only when the number field is changed.

## Entry points (VacDoc unless noted) - from grep, to be code-verified
child/add, child/edit, child/unapprove, child (number edit / patient merge), signup/step1 (doctor),
login, loginpa, forget, doctor/profile, doctor/clinic add+edit, manager-signup, PA add + edit-pa,
pa/profile, manager/profile, agent-module, bookings, alerts (display only).
VacParent: login. VacAdmin: agent, doctor, child, message. VacAgent: none found.
API controllers writing MobileNumber: Child, User, Doctor, Manager, PersonalAssistant, Agent, Message, Alert, FollowUp, Schedule.

## Decided 2026-10-22 (owner)
- Table = hand-written, most common countries where Pakistanis live (no libphonenumber, no new deps). Countries not in the table fall back to 6-15 digits (E.164 range).
- No validation at login / forgot-password; only when a number is written or changed.
- Existing stored numbers grandfathered. Prod count of would-fail rows: approved, but the read was blocked by the auto-mode classifier; pending owner action.

## Proposed table (national number digits, excl. trunk 0) - owner to confirm / correct
PK 92: 10, starts 3 | SA 966: 9, starts 5 | AE 971: 9, starts 5 | GB 44: 10, starts 7 | US/CA 1: 10
QA 974: 8 | KW 965: 8 | OM 968: 8 | BH 973: 8 | MY 60: 9-10 | AU 61: 9, starts 4 | DE 49: 10-11
IT 39: 9-10 | FR 33: 9 | ES 34: 9 | NL 31: 9 | NO 47: 8 | SE 46: 7-13 (verify) | DK 45: 8 | IE 353: 9
BE 32: 9 | GR 30: 10 | TR 90: 10 | CN 86: 11 | JP 81: 10 | KR 82: 9-10 | HK 852: 8 | SG 65: 8
AF 93: 9 | IN 91: 10 | BD 880: 10 | IR 98: 10 | ZA 27: 9 | NZ 64: 8-10
Lengths are from memory, not verified against ITU/national plans: verify before ship.

## Open
- Table source: hand-written vs libphonenumber metadata (needs npm dep in 4 frontends + NuGet in API; owner must approve new deps).
- Existing `countryCodes` list in child/add has ~240 entries, includes `1-684` style NANP codes and shared code `1`; table must key on country, not on the dial code alone.
- Prod data check: count rows whose stored number would fail (read-only SELECT, not run yet).
- Login/forget: validate there too, or only on write? (Rejecting at login could lock out grandfathered users. Recommend: NOT at login.)
