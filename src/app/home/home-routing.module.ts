import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePage } from './home.page';
import { StatsPage } from './stats.page/stats.page';

const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'stats',
    component: StatsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomePageRoutingModule {}
