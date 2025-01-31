import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { IonicModule } from '@ionic/angular';
import { IndexComponent } from './index/index.component';
import { ProfileComponent } from './profile/profile.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MaskitoDirective } from '@maskito/angular';


@NgModule({
  declarations: [IndexComponent, ProfileComponent],
  imports: [
    CommonModule,
    ProfileRoutingModule,
    IonicModule,
    ReactiveFormsModule,
    MaskitoDirective
  ]
})
export class ProfileModule { }
