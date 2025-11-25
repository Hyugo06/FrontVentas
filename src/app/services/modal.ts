import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Modal {

  private display = new BehaviorSubject<{ show: boolean, message: string }>({ show: false, message: '' });
  private result = new Subject<boolean>();

  constructor() { }

  open(message: string): Observable<boolean> {
    this.display.next({ show: true, message: message });
    this.result = new Subject<boolean>();
    return this.result.asObservable();
  }

  confirm(): void {
    this.display.next({ show: false, message: '' });
    this.result.next(true);
    this.result.complete();
  }

  cancel(): void {
    this.display.next({ show: false, message: '' });
    this.result.next(false);
    this.result.complete();
  }

  watch(): Observable<{ show: boolean, message: string }> {
    return this.display.asObservable();
  }
}
