import { Component, OnDestroy } from '@angular/core';
import { Storage } from '@ionic/storage';
import { PaLocationService } from 'src/app/services/pa-location.service';
import { ToastService } from 'src/app/shared/toast.service';
import { environment } from 'src/environments/environment';

declare const L: any;

// Doctor map: each tracked assistant's latest position (refreshed every 30 s) and, for the
// selected assistant, the route for the chosen day. Map = Leaflet + OpenStreetMap tiles.
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
  trailInfo = '';
  loading = true;

  private map: any = null;
  private markers: any[] = [];
  private trailLayer: any = null;
  private timer: any = null;
  private fitted = false;

  constructor(
    private locationService: PaLocationService,
    private storage: Storage,
    private toastService: ToastService,
  ) {}

  async ionViewWillEnter() {
    this.doctorId = Number(await this.storage.get(environment.DOCTOR_Id));
    this.date = this.todayPkt();
    await this.loadLeaflet();
    this.initMap();
    await this.refresh();
    this.timer = setInterval(() => this.refresh(), 30000);
  }

  ionViewWillLeave() { this.stop(); }
  ngOnDestroy() { this.stop(); }

  private stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.map) { this.map.remove(); this.map = null; }
    this.markers = []; this.trailLayer = null; this.fitted = false;
  }

  private todayPkt(): string {
    return new Date(Date.now() + 5 * 3600 * 1000).toISOString().substring(0, 10);
  }

  private utc(v: string): Date {
    return new Date(/Z|[+-]\d\d:\d\d$/.test(v) ? v : v + 'Z');
  }

  // Leaflet is pulled from a CDN on first use so the app bundle is unchanged.
  private loadLeaflet(): Promise<void> {
    if ((window as any).L) { return Promise.resolve(); }
    return new Promise<void>((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      const js = document.createElement('script');
      js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      js.onload = () => resolve();
      js.onerror = () => reject();
      document.head.appendChild(js);
    }).catch(() => { this.toastService.create('Could not load the map', 'danger'); });
  }

  private initMap() {
    if (this.map || !(window as any).L) { return; }
    this.map = L.map('assistantMap').setView([30.3753, 69.3451], 5); // Pakistan
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  async refresh() {
    try {
      this.assistants = (await this.locationService.getLive(this.doctorId).toPromise()) || [];
      this.assistants.forEach(a => {
        a.lastSeen = a.lastSeenAt ? this.utc(a.lastSeenAt) : null;
        a.ageMin = a.lastSeen ? Math.round((Date.now() - a.lastSeen.getTime()) / 60000) : null;
        // On shift but nothing for 5+ minutes = no signal
        a.status = !a.onShift ? 'off' : (a.ageMin === null || a.ageMin > 5 ? 'nosignal' : 'live');
      });
      this.drawMarkers();
      if (this.selectedPaId) { await this.loadTrail(); }
    } catch (e) {
      this.toastService.create('Could not load locations', 'danger');
    } finally {
      this.loading = false;
    }
  }

  ageText(a: any): string {
    if (a.ageMin === null) { return 'no location yet'; }
    if (a.ageMin < 1) { return 'just now'; }
    if (a.ageMin < 60) { return a.ageMin + ' min ago'; }
    return Math.round(a.ageMin / 60) + ' h ago';
  }

  private drawMarkers() {
    if (!this.map) { return; }
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];
    const colors: any = { live: '#1b9a5b', nosignal: '#c98a0a', off: '#9aa8aa' };
    const pts: any[] = [];
    this.assistants.filter(a => a.latitude != null).forEach(a => {
      const m = L.circleMarker([a.latitude, a.longitude], {
        radius: 9, color: '#fff', weight: 2, fillColor: colors[a.status], fillOpacity: 1
      }).addTo(this.map);
      m.bindTooltip(`${a.name} · ${this.ageText(a)}`, { permanent: true, direction: 'right', offset: [8, 0] });
      m.on('click', () => this.select(a));
      this.markers.push(m);
      pts.push([a.latitude, a.longitude]);
    });
    if (!this.fitted && pts.length) {
      this.map.fitBounds(pts, { padding: [40, 40], maxZoom: 16 });
      this.fitted = true;
    }
  }

  async select(a: any) {
    this.selectedPaId = a.paId;
    await this.loadTrail();
    if (a.latitude != null && this.map) { this.map.setView([a.latitude, a.longitude], Math.max(this.map.getZoom(), 14)); }
  }

  async onDateChange() { if (this.selectedPaId) { await this.loadTrail(); } }

  private async loadTrail() {
    if (this.trailLayer && this.map) { this.map.removeLayer(this.trailLayer); this.trailLayer = null; }
    const pts: any[] = (await this.locationService.getTrail(this.doctorId, this.selectedPaId, this.date).toPromise()) || [];
    if (!pts.length) { this.trailInfo = 'No locations recorded for this day.'; return; }
    const latlngs = pts.map(p => [p.Latitude !== undefined ? p.Latitude : p.latitude, p.Longitude !== undefined ? p.Longitude : p.longitude]);
    let km = 0;
    for (let i = 1; i < latlngs.length; i++) { km += this.haversine(latlngs[i - 1], latlngs[i]); }
    const first = this.utc(pts[0].RecordedAt || pts[0].recordedAt);
    const last = this.utc(pts[pts.length - 1].RecordedAt || pts[pts.length - 1].recordedAt);
    const t = (d: Date) => d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' });
    this.trailInfo = `${t(first)} → ${t(last)} · ${km.toFixed(1)} km · ${pts.length} points`;
    if (this.map) {
      this.trailLayer = L.polyline(latlngs, { color: '#0f5b63', weight: 4, opacity: .8 }).addTo(this.map);
      if (this.date !== this.todayPkt() || this.markers.length === 0) { this.map.fitBounds(this.trailLayer.getBounds(), { padding: [40, 40] }); }
    }
  }

  private haversine(a: number[], b: number[]): number {
    const r = (x: number) => x * Math.PI / 180;
    const dLat = r(b[0] - a[0]), dLon = r(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
}
