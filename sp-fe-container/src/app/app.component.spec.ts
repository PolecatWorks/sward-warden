import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { Location } from '@angular/common';

describe('AppComponent Routing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ActivatedRoute, useValue: {} }, provideRouter([])],
      imports: [AppComponent],
      providers: [{ provide: ActivatedRoute, useValue: {} },
        provideRouter(routes)
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
