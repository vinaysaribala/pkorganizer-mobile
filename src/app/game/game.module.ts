import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GameRoutingModule } from './game-routing.module';
import { IonicModule } from '@ionic/angular';
import { IndexComponent } from './index/index.component';
import { GameComponent } from './game/game.component';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [ IndexComponent, GameComponent],
  imports: [
    CommonModule,
    GameRoutingModule,
    IonicModule,
    ReactiveFormsModule
  ]
})
export class GameModule { }
