import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { NetworkService } from './network.service';

describe('NetworkService', () => {
  let service: NetworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NetworkService],
    });
    service = TestBed.inject(NetworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit the current online status as the initial value', async () => {
    const isOnline = await firstValueFrom(service.isOnline$.pipe(take(1)));
    // In the test browser we expect to be online
    expect(isOnline).toBe(navigator.onLine);
  });

  it('should emit false when an offline event is dispatched', (done) => {
    const values: boolean[] = [];
    const sub = service.isOnline$.subscribe(v => {
      values.push(v);
      // After initial + offline event
      if (values.length === 2) {
        expect(values[1]).toBe(false);
        sub.unsubscribe();
        done();
      }
    });
    window.dispatchEvent(new Event('offline'));
  });

  it('should emit true when an online event is dispatched', (done) => {
    const values: boolean[] = [];
    const sub = service.isOnline$.subscribe(v => {
      values.push(v);
      if (values.length === 3) {
        expect(values[2]).toBe(true);
        sub.unsubscribe();
        done();
      }
    });
    // Simulate going offline then back online
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
  });
});
