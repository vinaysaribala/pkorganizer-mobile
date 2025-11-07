import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Profile } from '../../model/profile';
import { Subject, takeUntil } from 'rxjs';
import { OrganizeService } from '../../services/organize.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: false
})
export class ProfileComponent implements OnInit, OnDestroy {
  form?: FormGroup;
  profileId?: number;
  profile?: Profile = {} as Profile
  readonly destroying$ = new Subject<void>();
  name: string = 'Add New';
  carriers = [
    { label: 'At&t', value: 'att' },
    { label: 'T-Mobile', value: 'tmobile' },
    { label: 'Verizon', value: 'verizon' },
    { label: 'Sprint', value: 'sprint' },
    { label: 'Boost', value: 'boost' },
    { label: 'Metro Pcs', value: 'metropcs' }
  ]

  constructor(private service: OrganizeService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController) { }

  public static buildForm(model: any): FormGroup {
    return new FormBuilder().group({
      id: new FormControl({ value: model?.id, disabled: false }),
      name: new FormControl({ value: model?.name, disabled: false }, [Validators.required]),
      phone: new FormControl({ value: model?.phone, disabled: false }),
      carrier: new FormControl({ value: model?.carrier, disabled: false }),
      email: new FormControl({ value: model?.email, disabled: false }, [Validators.email]),
      optIn: new FormControl({ value: model?.optIn ?? false, disabled: false})
    });
  }

  public static buildModel(form?: FormGroup, model?: Profile): Profile {
    let profile = { ...model, ...form?.getRawValue() };
    return profile;
  }


  ngOnDestroy(): void {
    this.destroying$.next();
    this.destroying$.complete();
  }

  ngOnInit() {
    this.form = ProfileComponent.buildForm(this.profile);
    this.route.params.pipe(takeUntil(this.destroying$)).subscribe({
      next: (params: any) => {
        this.profileId = +params['id'] || 0;
        if (this.profileId) {
          this.service.getProfiles().pipe(takeUntil(this.destroying$)).subscribe({
            next: (profiles) => {
              let profileData = profiles.find(p => p.id === this.profileId);
              if (profileData) {
                this.name = profileData.name;
                this.profile = profileData;

                this.form?.patchValue(this.profile);
              }
            },
            error: async () => {
              await this.presentToast('Something wrong.', 'close-outline');
            }
          });
        } else {
          this.form = ProfileComponent.buildForm(this.profile);
        }
      }
    });
  }

  async save() {
    if (this.form?.invalid) {
      return;
    }
    
    this.profile = ProfileComponent.buildModel(this.form, this.profile);
    try {
      if (this.profile?.id) {
        await this.service.updateProfile(this.profile);
      } else {
        await this.service.addProfile(this.profile);
      }

      await this.presentToast('Profile save success!', 'checkmark-outline');
      this.profile = undefined;
      this.router.navigate(['/profile']);
    } catch (error: any) {
      await this.presentToast('Profile save failed!' + error.message, 'close-outline');
    }
  }

  cancel() {
    this.router.navigate(['/']);
  }

  async presentToast(message: string, icon: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 1500,
      position: 'bottom',
      icon: icon
    });

    await toast.present();
  }

}
