import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartStatus } from './cart-status';

describe('CartStatus', () => {
  let component: CartStatus;
  let fixture: ComponentFixture<CartStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
