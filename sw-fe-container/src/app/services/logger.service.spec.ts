import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';
import { APP_CONFIG } from '../app-config';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: { apiPath: '/api', logLevel: 'DEBUG' } }
      ]
    });
    service = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call console.log when log is called', () => {
    const spy = spyOn(console, 'log');
    service.log('test message');
    expect(spy).toHaveBeenCalledWith('test message');
  });

  it('should call console.info when info is called', () => {
    const spy = spyOn(console, 'info');
    service.info('test message');
    expect(spy).toHaveBeenCalledWith('test message');
  });

  it('should call console.warn when warn is called', () => {
    const spy = spyOn(console, 'warn');
    service.warn('test message');
    expect(spy).toHaveBeenCalledWith('test message');
  });

  it('should call console.error when error is called', () => {
    const spy = spyOn(console, 'error');
    service.error('test message');
    expect(spy).toHaveBeenCalledWith('test message');
  });
});
