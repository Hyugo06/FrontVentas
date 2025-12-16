import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuponList } from './cupon-list';

describe('CuponList', () => {
  let component: CuponList;
  let fixture: ComponentFixture<CuponList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuponList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuponList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
