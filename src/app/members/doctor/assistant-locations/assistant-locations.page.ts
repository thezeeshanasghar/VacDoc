import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { PaLocationService } from 'src/app/services/pa-location.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';
import { fmtDateTime, fmtTime, isDay, parsePkt } from 'src/app/shared/pkt.util';

declare const L: any;

const REFRESH_MS = 30000;
const GAP_MS = 15 * 60 * 1000;
const MAX_JUMP_KMH = 150;
const TOAST_THROTTLE_MS = 120000;

// Leaflet is pulled from a CDN on first use so the app bundle is unchanged. One shared promise.
let leafletPromise: Promise<void> = null;
function loadLeafletOnce(): Promise<void> {
  if ((window as any).L) { return Promise.resolve(); }
  if (leafletPromise) { return leafletPromise; }
  leafletPromise = new Promise<void>((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const css = document.createElement('link');
      css.id = 'leaflet-css';
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
    }
    const old = document.getElementById('leaflet-js');
    if (old) { old.parentNode.removeChild(old); }
    const js = document.createElement('script');
    js.id = 'leaflet-js';
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = () => resolve();
    js.onerror = () => { js.parentNode.removeChild(js); reject(new Error('leaflet')); };
    document.head.appendChild(js);
  }).catch(e => { leafletPromise = null; throw e; });
  return leafletPromise;
}

// Doctor map: each tracked assistant's latest position (refreshed every 30 s) and, for the
// selected assistant, the route for the chosen day. Map = Leaflet + OpenStreetMap tiles.
// All times shown are Pakistan time and "now" comes from the server, never the phone clock.
@Component({
  selector: 'app-assistant-locations',
  templateUrl: './assistant-locations.page.html',
  styleUrls: ['./assistant-locations.page.scss'],
})
export class AssistantLocationsPage implements OnDestroy {
  doctorId: number = null;
  assistants: any[] = [];
  selectedPaId: number = null;
  date: string = '';                // yyyy-MM-dd, Pakistan day
  maxDate = '';                     // server "today"
  trailInfo = '';
  kmByPa: { [paId: number]: any } = {};
  kmError = false;
  loading = true;
  showAll = false;
  readonly palette = ['#e4572e', '#2f6fdb', '#8e44ad', '#e0a800', '#17a2b8', '#d6336c', '#6f4e37', '#5c7c00'];

  private map: any = null;
  private markerMap: { [paId: number]: any } = {};
  private trailLayers: any[] = [];
  private selLayers: any[] = [];
  private timer: any = null;
  private active = false;
  private fitted = false;
  private lastGoodDate = '';
  private liveMono = 0;             // performance.now() when the live response arrived
  private colorIdx: { [paId: number]: number } = {};
  private liveTok = 0;
  private kmTok = 0;
  private trailTok = 0;
  private lastToast = 0;
  private resizeFn = () => { if (this.map) { this.map.invalidateSize(); } };

  constructor(
    private locationService: PaLocationService,
    private storage: Storage,
    private toastService: ToastService,
    private route: ActivatedRoute,
  ) {}

  async ionViewWillEnter() {
    this.stop();                    // clears the timer first
    this.active = true;
    this.resetState();
    window.addEventListener('resize', this.resizeFn);
    try {
      this.doctorId = Number(await this.storage.get(environment.DOCTOR_Id));
      if (!this.active) { return; }
      try { await loadLeafletOnce(); } catch (e) { this.notify('Could not load the map'); }
      if (!this.active) { return; }
      this.initMap();
      const qp = this.route.snapshot.queryParams;
      await this.refresh(true, isDay(qp.date) ? qp.date : null);
      if (!this.active) { return; }
      if (qp.paId) {
        const a = this.assistants.find(x => String(x.paId) === String(qp.paId));
        if (a) { await this.select(a, true); }
      }
    } catch (e) {
      // fall through: the timer must still start
    }
    if (this.active) { this.scheduleNext(); }
  }

  ionViewDidEnter() {
    setTimeout(() => { if (this.map) { this.map.invalidateSize(); } }, 0);
    setTimeout(() => { if (this.map) { this.map.invalidateSize(); } }, 400);
  }

  ionViewWillLeave() { this.stop(); this.resetState(); }
  ngOnDestroy() { this.stop(); this.resetState(); }

  private stop() {
    this.active = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.liveTok++; this.kmTok++; this.trailTok++;
    window.removeEventListener('resize', this.resizeFn);
    if (this.map) { this.map.remove(); this.map = null; }
    this.markerMap = {}; this.trailLayers = []; this.selLayers = []; this.fitted = false;
  }

  private resetState() {
    this.selectedPaId = null; this.trailInfo = ''; this.kmByPa = {}; this.kmError = false;
    this.showAll = false; this.assistants = []; this.date = ''; this.lastGoodDate = ''; this.maxDate = '';
    this.loading = true;
  }

  // Self-rescheduling so refreshes never overlap.
  private scheduleNext() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (!this.active) { return; }
    this.timer = setTimeout(async () => {
      this.timer = null;
      try { await this.refresh(false); } catch (e) { /* handled inside */ }
      if (this.active) { this.scheduleNext(); }
    }, REFRESH_MS);
  }

  private notify(msg: string) {
    const now = Date.now();
    if (now - this.lastToast < TOAST_THROTTLE_MS) { return; }
    this.lastToast = now;
    this.toastService.create(msg, 'danger');
  }

  private initMap() {
    if (this.map || !(window as any).L) { return; }
    this.map = L.map('assistantMap').setView([30.3753, 69.3451], 5); // Pakistan
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    setTimeout(() => { if (this.map) { this.map.invalidateSize(); } }, 0);
  }

  // userAction = true on the initial load: fit the map once. Timer refreshes never move the map.
  async refresh(initial: boolean, forceDate?: string) {
    const tok = ++this.liveTok;
    try {
      const res: any = await this.locationService.getLive(this.doctorId).toPromise();
      if (!this.active || tok !== this.liveTok) { return; }
      let list: any[] = [];
      let nowPkt: string = null;
      if (Array.isArray(res)) { list = res; nowPkt = list.length ? list[0].serverNowPkt : null; }
      else if (res) { list = res.assistants || res.items || []; nowPkt = res.serverNowPkt; }
      if (!nowPkt && list.length) { nowPkt = list[0].serverNowPkt; }
      this.liveMono = performance.now();
      if (nowPkt) { this.setToday(String(nowPkt).substring(0, 10)); }
      this.assistants = list;
      this.assignColors();
      if (!this.date) { this.setDate(forceDate && forceDate <= (this.maxDate || forceDate) ? forceDate : (this.maxDate || '')); }
      this.drawMarkers(initial);
      await this.loadKm();
      if (!this.active || tok !== this.liveTok) { return; }
      if (this.selectedPaId || this.showAll) { await this.loadTrail(false); }
    } catch (e) {
      if (this.active && tok === this.liveTok) { this.notify('Could not load locations'); }
    } finally {
      if (this.active && tok === this.liveTok) { this.loading = false; }
    }
  }

  private setToday(day: string) {
    if (!isDay(day)) { return; }
    this.maxDate = day;
    if (this.date && this.date > day) { this.setDate(day); }
  }

  private setDate(d: string) { this.date = d; this.lastGoodDate = d; }

  // Km for the chosen day, shown on each assistant row (same figures as the Assistant KM report).
  private async loadKm() {
    if (!this.date) { return; }
    const tok = ++this.kmTok;
    const date = this.date;
    try {
      const res: any = await this.locationService.getKm(this.doctorId, date, date).toPromise();
      if (!this.active || tok !== this.kmTok || date !== this.date) { return; }
      const map: any = {};
      ((res && res.assistants) || []).forEach(a => { map[a.paId] = a.cells && a.cells[0]; });
      if (res && res.serverTodayPkt) { this.setToday(res.serverTodayPkt); }
      this.kmByPa = map;
      this.kmError = false;
    } catch (e) {
      if (!this.active || tok !== this.kmTok || date !== this.date) { return; }
      this.kmError = true;
    }
  }

  kmText(a: any): string {
    const c = this.kmByPa[a.paId];
    if (!c) { return ''; }
    if (c.noGps) { return 'No GPS'; }
    if (!c.shifts && !c.fixes) { return ''; }
    return c.km.toFixed(1) + ' km';
  }

  hasGap(a: any): boolean { const c = this.kmByPa[a.paId]; return !!(c && c.gaps && !c.noGps); }

  lowCoverage(a: any): boolean {
    const c = this.kmByPa[a.paId];
    return !!(c && !c.noGps && typeof c.coverage === 'number' && c.coverage < 0.8 && (c.shifts || c.fixes));
  }

  explainGap(ev: Event) {
    if (ev) { ev.stopPropagation(); }
    this.toastService.create('GPS gap over 15 min — real distance may be higher', 'dark');
  }

  statusLabel(a: any): string {
    if (a.status === 'onshift') { return 'On shift'; }
    if (a.status === 'nosignal') { return 'On shift · no signal'; }
    return 'Off duty';
  }

  lastKnownText(a: any): string { return fmtDateTime(a.lastSeenAt); }

  private ageSec(a: any): number {
    if (a.ageSeconds === null || a.ageSeconds === undefined) { return null; }
    return Number(a.ageSeconds) + Math.max(0, (performance.now() - this.liveMono) / 1000);
  }

  ageText(a: any): string {
    const s = this.ageSec(a);
    if (s === null) { return 'no location yet'; }
    if (s < 60) { return 'just now'; }
    if (s < 3600) { return Math.floor(s / 60) + ' min ago'; }
    if (s < 86400) { return Math.floor(s / 3600) + ' h ago'; }
    return Math.floor(s / 86400) + ' d ago';
  }

  private assignColors() {
    const ids = this.assistants.map(a => Number(a.paId)).sort((x, y) => x - y);
    const m: any = {};
    ids.forEach((id, i) => { m[id] = i; });
    this.colorIdx = m;
  }

  // Stable, unique colour per assistant: palette first, then golden-angle HSL.
  colorOf(a: any): string {
    let i = this.colorIdx[Number(a.paId)];
    if (i === undefined) { i = Math.abs(Number(a.paId)); }
    if (i < this.palette.length) { return this.palette[i]; }
    return 'hsl(' + Math.round((i * 137.508) % 360) + ',65%,42%)';
  }

  private drawMarkers(fit: boolean) {
    if (!this.map) { return; }
    const colors: any = { onshift: '#1b9a5b', nosignal: '#c98a0a', off: '#9aa8aa' };
    const pts: any[] = [];
    const seen: any = {};
    this.assistants.filter(a => a.latitude != null && a.longitude != null).forEach(a => {
      seen[a.paId] = true;
      const stale = a.status !== 'onshift';
      const style = {
        radius: 9, color: this.colorOf(a), weight: 4, fillColor: colors[a.status] || colors.off,
        fillOpacity: stale ? 0.5 : 1, opacity: stale ? 0.55 : 1
      };
      const label = `${a.name} · ${a.lastKnown ? 'last known ' + this.lastKnownText(a) : this.ageText(a)}`;
      let m = this.markerMap[a.paId];
      if (m) {
        m.setLatLng([a.latitude, a.longitude]);
        m.setStyle(style);
        m.setTooltipContent(label);
      } else {
        m = L.circleMarker([a.latitude, a.longitude], style).addTo(this.map);
        m.bindTooltip(label, { permanent: true, direction: 'right', offset: [8, 0] });
        m.on('click', () => this.select(a));
        this.markerMap[a.paId] = m;
      }
      pts.push([a.latitude, a.longitude]);
    });
    Object.keys(this.markerMap).forEach(k => {
      if (!seen[k]) { this.map.removeLayer(this.markerMap[k]); delete this.markerMap[k as any]; }
    });
    if (fit && !this.fitted && pts.length) {
      this.map.fitBounds(pts, { padding: [40, 40], maxZoom: 16 });
      this.fitted = true;
    }
  }

  // Tapping the selected assistant again deselects.
  async select(a: any, forceSelect?: boolean) {
    try {
      if (this.selectedPaId === a.paId && !forceSelect) {
        this.selectedPaId = null;
        this.trailInfo = '';
        await this.loadTrail(false);
        return;
      }
      this.selectedPaId = a.paId;
      const drew = await this.loadTrail(true);
      if (drew === false && a.latitude != null && this.map && this.selectedPaId === a.paId) {
        this.map.setView([a.latitude, a.longitude], Math.max(this.map.getZoom(), 14));
      }
    } catch (e) { /* keep going: the timer must not die with a failed select */ }
  }

  async onDateChange() {
    if (!isDay(this.date) || (this.maxDate && this.date > this.maxDate)) {
      this.date = this.lastGoodDate;       // empty / invalid / future: revert
      return;
    }
    this.lastGoodDate = this.date;
    await this.loadKm();
    if (this.selectedPaId || this.showAll) { await this.loadTrail(true); }
    else { this.clearTrails(); this.trailInfo = ''; }
  }

  async onShowAllChange() { await this.loadTrail(true); }

  private clearTrails() {
    this.trailLayers.forEach(l => { if (this.map) { this.map.removeLayer(l); } });
    this.trailLayers = []; this.selLayers = [];
  }

  private jump(a: any, b: any): boolean {
    const km = this.haversine([a.lat, a.lng], [b.lat, b.lng]);
    const hrs = (parsePkt(b.recordedAt).getTime() - parsePkt(a.recordedAt).getTime()) / 3600000;
    return hrs > 0 && km / hrs > MAX_JUMP_KMH;
  }

  // Splits usable points into segments: break on shift change, >15 min gap, or an impossible jump.
  private segments(points: any[]): number[][][] {
    const segs: number[][][] = [];
    let cur: number[][] = [];
    let prev: any = null;
    points.filter(p => p.usable !== false && parsePkt(p.recordedAt)).forEach(p => {
      if (prev) {
        const dt = parsePkt(p.recordedAt).getTime() - parsePkt(prev.recordedAt).getTime();
        if (p.shiftId !== prev.shiftId || dt > GAP_MS || this.jump(prev, p)) {
          if (cur.length) { segs.push(cur); }
          cur = [];
        }
      }
      cur.push([p.lat, p.lng]);
      prev = p;
    });
    if (cur.length) { segs.push(cur); }
    return segs;
  }

  // Returns true if a trail was drawn for the selected assistant (or any when none selected),
  // false if nothing to draw, undefined if superseded. fit = user action: allowed to move the map.
  private async loadTrail(fit: boolean): Promise<boolean> {
    const tok = ++this.trailTok;
    const date = this.date, sel = this.selectedPaId, all = this.showAll;
    if (!this.map || !date) { return false; }
    const targets = all ? this.assistants.slice() : this.assistants.filter(a => a.paId === sel);
    if (!targets.length) { this.clearTrails(); this.trailInfo = ''; return false; }
    let failed = 0;
    const results = await Promise.all(targets.map(async a => {
      try {
        return { a, res: await this.locationService.getTrailV2(this.doctorId, a.paId, date).toPromise(), err: false };
      } catch (e) { failed++; return { a, res: null, err: true }; }
    }));
    if (!this.active || !this.map || tok !== this.trailTok || date !== this.date || sel !== this.selectedPaId || all !== this.showAll) {
      return undefined;
    }
    if (failed) { this.notify(failed === targets.length ? 'Could not load the route' : 'Could not load some routes'); }
    this.clearTrails();
    this.trailInfo = '';
    let bounds: any = null;
    let selBounds: any = null;
    results.forEach(r => {
      const isSel = r.a.paId === sel;
      if (r.err) { if (isSel) { this.trailInfo = 'Could not load this route.'; } return; }
      const res = r.res || {};
      if (res.serverNowPkt) { this.setToday(String(res.serverNowPkt).substring(0, 10)); }
      const points: any[] = res.points || [];
      const segs = this.segments(points);
      segs.forEach(seg => {
        const line = L.polyline(seg, {
          color: this.colorOf(r.a), weight: isSel || !all ? 5 : 3, opacity: isSel || !all ? .9 : .6
        }).addTo(this.map);
        this.trailLayers.push(line);
        if (isSel) { this.selLayers.push(line); }
        const b = line.getBounds();
        bounds = bounds ? bounds.extend(b) : L.latLngBounds(b.getSouthWest(), b.getNorthEast());
        if (isSel) { selBounds = selBounds ? selBounds.extend(b) : L.latLngBounds(b.getSouthWest(), b.getNorthEast()); }
      });
      if (isSel) {
        const usable = points.filter(p => p.usable !== false);
        if (!usable.length) { this.trailInfo = 'No locations recorded for this day.'; }
        else {
          const km = Number(res.km || 0).toFixed(1);
          this.trailInfo = `${fmtTime(usable[0].recordedAt)} → ${fmtTime(usable[usable.length - 1].recordedAt)} · ${km} km${res.gaps ? ' ⚠' : ''} · ${usable.length} points`;
        }
      }
    });
    this.selLayers.forEach(l => l.bringToFront());
    if (sel && !this.trailInfo) { this.trailInfo = 'No locations recorded for this day.'; }
    const target = selBounds || bounds;
    if (fit && target) { this.map.fitBounds(target, { padding: [40, 40] }); }
    return !!(sel ? selBounds : bounds);
  }

  private haversine(a: number[], b: number[]): number {
    const r = (x: number) => x * Math.PI / 180;
    const dLat = r(b[0] - a[0]), dLon = r(b[1] - a[1]);
    const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
}
