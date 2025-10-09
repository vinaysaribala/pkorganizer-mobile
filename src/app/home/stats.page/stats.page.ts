import { Component, OnInit } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';
import { Game } from 'src/app/model/game';
import { Profile } from 'src/app/model/profile';
import { OrganizeService } from 'src/app/services/organize.service';

@Component({
  selector: 'app-stats.page',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: false,
})
export class StatsPage implements OnInit {

  constructor(private service: OrganizeService) { }
  balances: { [key: number]: number } = {};
  readonly destroying$ = new Subject<void>();
  barChartData?: ChartData<'bar'>;
  profiles: Profile[] = [];
  selectedPlayerIds: number[] = [];

  ngOnInit() {
    this.service.getGames().pipe(takeUntil(this.destroying$))
      .subscribe({
        next: (games) => {
          this.service.getProfiles().pipe(takeUntil(this.destroying$))
            .subscribe({
              next: (profiles) => {
                this.profiles = profiles;
                this.selectedPlayerIds = profiles.map(p => p.id);
                this.calculateBalances(games, profiles);
              }
            });
        }
      });
  }
  calculateBalances(games: Game[], profiles: Profile[]) {
    games.filter(game => game.isSettled).forEach(game => {
      game.settlements.forEach(settlement => {
        this.balances[settlement.fromPlayerId] = (this.balances[settlement.fromPlayerId] || 0) - settlement.amount;
        this.balances[settlement.toPlayerId] = (this.balances[settlement.toPlayerId] || 0) + settlement.amount;
      });
    });

    this.loadPlayerStats(profiles);
  }

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Poker player statistics' }
    }
  };


  private loadPlayerStats(profiles: Profile[]) {
  const gainedLabels: string[] = [];
  const gainedData: number[] = [];
  const lostLabels: string[] = [];
  const lostData: number[] = [];

  Object.keys(this.balances).forEach(playerId => {
    const profile = profiles.find(p => p.id === +playerId);
    if (profile) {
      const balance = this.balances[+playerId];
      if (balance >= 0) {
        gainedLabels.push(profile.name);
        gainedData.push(balance);
      } else {
        lostLabels.push(profile.name);
        lostData.push(Math.abs(balance));
      }
    }
  });

  this.barChartData = {
    labels: [...gainedLabels, ...lostLabels],
    datasets: [
      {
        label: 'Gained Players',
        data: [...gainedData, ...Array(lostData.length).fill(0)],
        backgroundColor: '#2c9c16ff'
      },
      {
        label: 'Lost Players',
        data: [...Array(gainedData.length).fill(0), ...lostData],
        backgroundColor: '#e43f3fff'
      }
    ]
  };
}

  onPlayerSelectionChange() {
    this.loadPlayerStats(this.profiles.filter(p => this.selectedPlayerIds.includes(p.id)));
  }

  getSelectedPlayersText(): string {
      const players = this.profiles.filter(p => this.selectedPlayerIds.includes(p.id));
      if (!players || players.length === 0) {
        return 'Select players';
      }
      if (players.length <= 3) {
        return players.map(s => (s.name)).join(', ');
      }
      return `${players.length} players selected`;
    }
}
