import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Game } from '../../model/game';
import { OrganizeService } from '../../services/organize.service';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  standalone: false
})
export class IndexComponent  implements OnInit, OnDestroy {

  games: Game[] = []
  readonly destroying$ = new Subject<void>();

  constructor(private service: OrganizeService) { }
  ngOnDestroy(): void {
    this.destroying$.next();
    this.destroying$.complete();
  }

  ngOnInit() {
    this.service.getGames().pipe(takeUntil(this.destroying$)).subscribe({
      next: (games) => {
        this.games = games;
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

}
