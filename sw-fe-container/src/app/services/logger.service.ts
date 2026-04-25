import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  log(message: any, ...args: any[]): void {
    console.log(message, ...args);
  }

  info(message: any, ...args: any[]): void {
    console.info(message, ...args);
  }

  warn(message: any, ...args: any[]): void {
    console.warn(message, ...args);
  }

  error(message: any, ...args: any[]): void {
    console.error(message, ...args);
  }
}
