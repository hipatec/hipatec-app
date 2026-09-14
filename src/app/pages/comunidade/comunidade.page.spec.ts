import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComunidadePage } from './comunidade.page';

describe('ComunidadePage', () => {
  let component: ComunidadePage;
  let fixture: ComponentFixture<ComunidadePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ComunidadePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
