import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService, UserRole } from '../services/auth.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('roleGuard', () => {
  let authServiceMock: { hasRole: ReturnType<typeof vi.fn> };
  let routerMock: { parseUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceMock = {
      hasRole: vi.fn(),
    };
    routerMock = {
      parseUrl: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should allow access if the user has the required role', () => {
    authServiceMock.hasRole.mockReturnValue(true);
    const requiredRole: UserRole = 'admin';

    // Need to execute the outer function to get the actual CanActivateFn,
    // then execute it within the inject context using TestBed.runInInjectionContext
    const guardFn = roleGuard(requiredRole);

    const result = TestBed.runInInjectionContext(() => {
      // For CanActivateFn we can pass null/any for route/state since they aren't used in this guard
      return guardFn(null as any, null as any);
    });

    expect(authServiceMock.hasRole).toHaveBeenCalledWith(requiredRole);
    expect(result).toBe(true);
  });

  it('should redirect to /error if the user lacks the required role', () => {
    authServiceMock.hasRole.mockReturnValue(false);
    const mockUrlTree = {} as UrlTree;
    routerMock.parseUrl.mockReturnValue(mockUrlTree);
    const requiredRole: UserRole = 'admin';

    // Spy on console.error to avoid polluting test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const guardFn = roleGuard(requiredRole);

    const result = TestBed.runInInjectionContext(() => {
      return guardFn(null as any, null as any);
    });

    expect(authServiceMock.hasRole).toHaveBeenCalledWith(requiredRole);
    expect(routerMock.parseUrl).toHaveBeenCalledWith('/error');
    expect(consoleSpy).toHaveBeenCalledWith(`Access denied: Required role ${requiredRole}`);
    expect(result).toBe(mockUrlTree);

    consoleSpy.mockRestore();
  });
});
