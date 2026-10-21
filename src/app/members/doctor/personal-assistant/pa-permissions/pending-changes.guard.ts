import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { PaPermissionsPage } from './pa-permissions.page';

@Injectable({ providedIn: 'root' })
export class PendingPermissionsGuard implements CanDeactivate<PaPermissionsPage> {
  canDeactivate(page: PaPermissionsPage): Promise<boolean> {
    return page.confirmLeave();
  }
}
