import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Profile } from '../../model/profile';
import { OrganizeService } from '../../services/organize.service';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  standalone: false
})
export class IndexComponent  implements OnInit, OnDestroy {

  profiles: Profile[] = []
  readonly destroying$ = new Subject<void>();

  constructor(private service: OrganizeService) { }
  ngOnDestroy(): void {
    this.destroying$.next();
    this.destroying$.complete();
  }

  ngOnInit() {
    this.service.getProfiles().pipe(takeUntil(this.destroying$)).subscribe({
      next: (profiles) => {
        this.profiles = profiles;
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

}
