import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayoutComponent } from './main-layout.component';
import { RxdbService } from '../services/rxdb/rxdb.service';
import { AuthService } from '../services/auth.service';
import { FarmManagementService } from '../services/farm-management.service';
import { SyncEngineService } from '../services/sync-engine.service';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let rxdbServiceSpy: jasmine.SpyObj<RxdbService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let farmServiceSpy: jasmine.SpyObj<FarmManagementService>;
  let syncEngineServiceSpy: jasmine.SpyObj<SyncEngineService>;
  let router: Router;

  const mockUser = { id: 1, name: 'Seamus O\'Neill', email: 'seamus@example.com', role: 'admin' };
  const mockUsers = [
    { id: 1, name: 'Seamus O\'Neill', email: 'seamus@example.com', role: 'admin' },
    { id: 2, name: 'John Doe', email: 'john@example.com', role: 'user' }
  ];

  beforeEach(async () => {
    rxdbServiceSpy = jasmine.createSpyObj('RxdbService', [], {
      fallbackToRest$: of(false)
    });
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId', 'login', 'logout']);
    farmServiceSpy = jasmine.createSpyObj('FarmManagementService', ['getUser', 'getUsers']);

    authServiceSpy.getUserId.and.returnValue('1');
    farmServiceSpy.getUser.and.returnValue(of(mockUser));
    farmServiceSpy.getUsers.and.returnValue(of(mockUsers));
    syncEngineServiceSpy = jasmine.createSpyObj('SyncEngineService', ['forcePullSync']);

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: RxdbService, useValue: rxdbServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: FarmManagementService, useValue: farmServiceSpy },
        { provide: SyncEngineService, useValue: syncEngineServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should create and load data on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(authServiceSpy.getUserId).toHaveBeenCalled();
    expect(farmServiceSpy.getUser).toHaveBeenCalledWith('1');
    expect(farmServiceSpy.getUsers).toHaveBeenCalled();
  });

  it('should render switcher options', () => {
    fixture.detectChanges();
    const selectEl = fixture.debugElement.query(By.css('#user-switcher-dropdown'));
    expect(selectEl).toBeTruthy();

    const options = selectEl.nativeElement.querySelectorAll('option');
    expect(options.length).toBe(2);
    expect(options[0].textContent.trim()).toBe("Seamus O'Neill (admin)");
    expect(options[1].textContent.trim()).toBe("John Doe (user)");
  });

  it('should call authService.login and reload on switchUser', () => {
    spyOn(component, 'reloadPage');
    fixture.detectChanges();

    component.switchUser('2');
    expect(authServiceSpy.login).toHaveBeenCalledWith('2');
    expect(component.reloadPage).toHaveBeenCalled();
  });

  it('should call switchUser when dropdown selection changes', () => {
    spyOn(component, 'switchUser');
    fixture.detectChanges();

    const selectEl = fixture.debugElement.query(By.css('#user-switcher-dropdown'));
    selectEl.nativeElement.value = '2';
    selectEl.nativeElement.dispatchEvent(new Event('change'));

    fixture.detectChanges();
    expect(component.switchUser).toHaveBeenCalledWith('2');
  });
});
