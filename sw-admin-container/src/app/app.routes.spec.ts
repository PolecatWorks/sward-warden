import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { vi } from 'vitest';

describe('App Routes', () => {
  let router: Router;
  let authServiceSpy: { hasRole: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Create a mock for AuthService using vitest's vi.fn
    authServiceSpy = {
      hasRole: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    router = TestBed.inject(Router);
  });

  it('should redirect default path to dashboard', async () => {
    authServiceSpy.hasRole.mockReturnValue(true); // Allow layout activation
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(router.url).toBe('/dashboard');
  });

  it('should allow support role to access dashboard, explorer, audit', async () => {
    // Mock role check logic manually based on roles
    authServiceSpy.hasRole.mockImplementation((role) => {
      if (role === 'support') return true;
      return false;
    });

    const harness = await RouterTestingHarness.create();

    // Test access to dashboard
    await harness.navigateByUrl('/dashboard');
    expect(router.url).toBe('/dashboard');

    // Test access to explorer
    await harness.navigateByUrl('/explorer');
    expect(router.url).toBe('/explorer');

    // Test access to audit
    await harness.navigateByUrl('/audit');
    expect(router.url).toBe('/audit');
  });

  it('should prevent support role from accessing users', async () => {
    authServiceSpy.hasRole.mockImplementation((role) => {
      if (role === 'support') return true;
      if (role === 'admin') return false; // Prevent admin access
      return false;
    });

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/users');

    // Should not successfully navigate to users
    expect(router.url).not.toBe('/users');
  });

  it('should allow admin role to access users', async () => {
    authServiceSpy.hasRole.mockReturnValue(true); // Allow any required role

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/users');
    expect(router.url).toBe('/users');
  });

  it('should prevent access to layout route if not support or admin', async () => {
    authServiceSpy.hasRole.mockReturnValue(false); // Deny all

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/dashboard');

    // Should not navigate successfully since the parent layout component is guarded
    expect(router.url).not.toBe('/dashboard');
  });
});
