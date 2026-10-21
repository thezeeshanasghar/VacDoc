#!/bin/bash
# TIMESTAMP_SPEC ban check. Fails on raw date/time calls outside shared/time.ts unless the line has `// time-ok`.
cd "$(dirname "$0")/.." || exit 1
BAN='[^|]\| *date *(:|\}\}|\)|$)|new Date\(|toISOString|toLocale(Date|Time)String|\.get(Hours|Minutes|Date|Day|Month|FullYear)\(|Intl\.DateTimeFormat|Asia/Karachi|\+0500|utcOffset|moment\(\)'
hits=$(grep -rnE "$BAN" src --include='*.ts' --include='*.html' | grep -v 'src/app/shared/time.ts' | grep -v 'time-ok' | grep -vE '^[^:]+:[0-9]+:[[:space:]]*(//|\*|/\*|<!--)')
if [ -n "$hits" ]; then echo "$hits"; echo; echo "check-time: raw date/time use above. Use shared/time.ts or tag the line // time-ok"; exit 1; fi
CANON=../VacDoc/src/app/shared/time.ts
if [ -f "$CANON" ] && ! cmp -s "$CANON" src/app/shared/time.ts; then echo "check-time: shared/time.ts differs from VacDoc's copy"; exit 1; fi
echo "check-time: ok"
