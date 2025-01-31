import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { GameComponent } from './game/game.component';

const routes: Routes = [
  {
      path: '',
      component: IndexComponent
    },
    {
      path: 'add',
      component: GameComponent
    },
    {
      path: 'edit/:id',
      component: GameComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GameRoutingModule { }
