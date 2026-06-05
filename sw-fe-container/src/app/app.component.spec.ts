import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { Location } from '@angular/common';
import { AuthService } from './services/auth.service';

describe('AppComponent Routing', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUserId']);
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.getUserId.and.returnValue('1');

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        provideRouter(routes),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  it('should redirect to /home on empty path', async () => {
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    // Initial navigation
    await router.navigate(['']);
    expect(location.path()).toBe('/home');
  });

  it('should redirect to /home on unknown path', async () => {
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    await router.navigate(['/some-unknown-path']);
    expect(location.path()).toBe('/home');
  });
});
