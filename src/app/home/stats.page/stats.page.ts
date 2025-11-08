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
  standalone: false
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
      game.players.forEach(player => {
        this.balances[player.profileId] = (((player.buyIns ?? 0) - (player.returnBuyIns ?? 0)) * game.buyInValue) + (this.balances[player.profileId] || 0);
      });
    });

    this.loadPlayerStats(profiles);
  }

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false, // allow chart to stretch to container height
    indexAxis: 'y',
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Poker player statistics' }
    },
    layout: {
      padding: 0
    }
  };


  private loadPlayerStats(profiles: Profile[]) {
    const playerData: { label: string; originalValue: number; displayValue: number }[] = [];

    // Collect all players with their balances
    Object.keys(this.balances).forEach(playerId => {
      const profile = profiles.find(p => p.id === +playerId);
      if (profile) {
        const balance = this.balances[+playerId];
        playerData.push({
          label: profile.name,
          originalValue: balance,
          displayValue: Math.abs(balance)
        });
      }
    });

    // Sort by original value from highest to lowest
    playerData.sort((a, b) => b.originalValue - a.originalValue);

    // Extract sorted arrays
    const labels = playerData.map(p => p.label);
    const data = playerData.map(p => p.displayValue);
    const originalValues = playerData.map(p => p.originalValue);

    // Create a single dataset with conditional colors based on original sign
    this.barChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Player Balance',
          data: data,
          // Function to return green for positive, red for negative (based on original value)
          backgroundColor: (context) => {
            const originalValue = originalValues[context.dataIndex];
            return originalValue >= 0 ? '#2c9c16ff' : '#e43f3fff';
          },
          borderColor: (context) => {
            const originalValue = originalValues[context.dataIndex];
            return originalValue >= 0 ? '#2c9c16ff' : '#e43f3fff';
          },
          borderWidth: 1
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
