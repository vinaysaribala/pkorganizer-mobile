import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Game } from '../../model/game';
import { OrganizeService } from '../../services/organize.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { Player } from '../../model/player';
import { Profile } from '../../model/profile';
import { Settlement } from '../../model/settlement';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  standalone: false,
})
export class GameComponent implements OnInit, OnDestroy {

  form?: FormGroup;
  playerForm?: FormGroup;
  settleForm?: FormGroup;
  gameId?: number;
  game?: Game;
  name: string = 'Add Game'
  players: Player[] = [];
  profiles: Profile[] = [];
  settlements: Settlement[] = [];
  isModalOpen: boolean = false;
  isSettleModalOpen: boolean = false;
  readonly destroying$ = new Subject<void>();

  constructor(private service: OrganizeService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private alertController: AlertController,
    private emailService: EmailService,
    private cdr: ChangeDetectorRef) { }

  public static buildForm(model: any): FormGroup {
    let date = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/[, ]/g, ' ');

    return new FormBuilder().group({
      id: new FormControl({ value: model ? model.id : 0, disabled: model?.isSettled }),
      playDate: new FormControl({ value: model ? model.name : date, disabled: true }),
      buyInValue: new FormControl({ value: model ? model.buyInValue : 10, disabled: model?.isSettled }, [Validators.required]),
      buyInPoints: new FormControl({ value: model ? model.buyInPoints : 200, disabled: model?.isSettled }, [Validators.required]),
      isSettled: new FormControl({ value: model ? model.isSettled : false, disabled: true }, [Validators.required]),
      players: new FormControl({ value: model ? model.players : [], disabled: model?.isSettled }, [Validators.required]),
    });
  }

  public static buildPlayerForm(model: any): FormGroup {
    return new FormBuilder().group({
      profileId: new FormControl({ value: model?.profileId, disabled: false }),
      name: new FormControl({ value: model?.name, disabled: true }),
      buyIns: new FormControl({ value: model?.buyIns, disabled: false }, [Validators.required, Validators.min(1)]),
      returnBuyIns: new FormControl({ value: model?.returnBuyIns, disabled: false }),
    });
  }

  public static buildSettleForm(model: any): FormGroup {
    return new FormBuilder().group({
      fromPlayerId: new FormControl({ value: model?.fromPlayerId, disabled: false }, [Validators.required]),
      toPlayerId: new FormControl({ value: model?.toPlayerId, disabled: false }, [Validators.required]),
      amount: new FormControl({ value: model?.amount, disabled: false }, [Validators.required]),
    });
  }

  ngOnDestroy(): void {
    this.destroying$.next();
    this.destroying$.complete();
  }

  ngOnInit() {
    this.form = GameComponent.buildForm(this.game);
    this.route.params.pipe(takeUntil(this.destroying$)).subscribe({
      next: (params: any) => {
        this.gameId = +params['id'] || 0;
        if (this.gameId) {
          this.service.getGames().pipe(takeUntil(this.destroying$)).subscribe({
            next: (games) => {
              let gameData = games.find(p => p.id === this.gameId);
              if (gameData) {
                this.name = gameData.playDate;
                this.game = gameData;
                this.settlements = this.game.settlements ?? [];
                this.form?.patchValue(this.game);
                if (this.game.isSettled) {
                  this.form?.disable();
                }
                this.loadProfiles();
              }
            },
            error: async () => {
              await this.presentToast('Something wrong.', 'close-outline');
            }
          });
        } else {
          this.loadProfiles();
        }
      }
    });
  }

  loadProfiles() {
    this.service.getProfiles().pipe(takeUntil(this.destroying$)).subscribe({
      next: (profiles) => {
        if (profiles) {
          this.profiles = profiles;
          this.players = profiles.map((d: any) => ({ profileId: d.id, buyIns: 1, isSettled: false, returnBuyIns: undefined, name: d.name, gameId: this.gameId, balance: undefined } as Player));
          if (this.game?.players) {
            this.game?.players.forEach((player: Player) => {
              this.setPlayer(player);
            });
          }
          this.cdr.detectChanges();
        }
      },
      error: async () => {
        await this.presentToast('Something wrong.', 'close-outline');
      }
    });
  }

  private setPlayer(model: Player) {
    let players = this.form?.get('players')?.getRawValue();
    this.players = this.players.map(p => p.profileId === model.profileId ? { ...p, buyIns: model.buyIns, returnBuyIns: model.returnBuyIns, balance: model.returnBuyIns != null && model.returnBuyIns != undefined && model.returnBuyIns >= 0 ? model.returnBuyIns - model.buyIns : model.balance, isSettled: model.isSettled } : p);
    players = players.map((p: Player) => p.profileId === model.profileId ? { ...p, buyIns: model.buyIns, returnBuyIns: model.returnBuyIns, balance: model.returnBuyIns != null && model.returnBuyIns != undefined && model.returnBuyIns >= 0 ? model.returnBuyIns - model.buyIns : model.balance, isSettled: model.isSettled, gameId: this.gameId } : p);
    this.form?.get('players')?.patchValue(players);
  }

  getSelectedPlayersText(): string {
    const players = this.form?.get('players')?.value as Player[];
    if (!players || players.length === 0) {
      return 'Select players';
    }
    if (players.length <= 3) {
      return players.map(s => (s.name)).join(', ');
    }
    return `${players.length} players selected`;
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

  async presentAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Settle Game',
      message: message,
      buttons: ['Ok'],
    });

    await alert.present();
  }

  compareWithFn(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.profileId === o2.profileId : o1 === o2;
  }

  async save(navigateAway: boolean = true) {
    if (this.form?.invalid) {
      return;
    }

    let game = this.form?.getRawValue();
    game = { ...game, totalBuyIns: game.players.reduce((sum: any, item: { buyIns: any; }) => sum + item.buyIns, 0), settlements: this.settlements };
    try {
      if (this.game?.id) {
        await this.service.updateGame(game);
      } else {
        await this.service.addGame(game);
      }

      await this.presentToast('Game save success!', 'checkmark-outline');
      if (this.game?.isSettled) {
        this.emailService.sendEmail(this.settlements);
      }
      if (navigateAway || (this.gameId ?? 0) === 0 ) {
        this.router.navigate(['/game']);
      }
    } catch (error) {
      await this.presentToast('Game save failed!', 'close-outline');
    }
  }

  editPlayer(player: Player) {
    this.playerForm = GameComponent.buildPlayerForm(player);
    this.isModalOpen = true;
  }

  closeEditPlayer() {
    this.isModalOpen = false;
  }

  closeSettlement() {
    this.isSettleModalOpen = false;
  }

  savePlayer() {
    if (this.playerForm?.invalid) {
      return;
    }

    this.setPlayer(this.playerForm?.getRawValue());
    this.isModalOpen = false;
    this.save(false);
    this.cdr.detectChanges();
  }

  cancel() {
    this.router.navigate(['/']);
  }

  get totalBuyIns() {
    let players = this.form?.get('players')?.getRawValue();
    if (players) {
      return players.reduce((sum: any, item: { buyIns: any; }) => sum + item.buyIns, 0)
    } else {
      return 0;
    }
  }

  get totalReturnBuyIns() {
    let players = this.form?.get('players')?.getRawValue();
    if (players) {
      return players.reduce((sum: any, item: { returnBuyIns?: any }) => sum + (item.returnBuyIns ?? 0), 0)
    } else {
      return 0;
    }
  }

  get totalBalance() {
    let players = this.form?.get('players')?.getRawValue();
    if (players) {
      return players.reduce((sum: any, item: { balance?: any; }) => sum + (item.balance ?? 0), 0)
    } else {
      return 0;
    }
  }

  profileName(profileId: number) {
    return this.profiles.find(p => p.id === profileId)?.name
  }

  async settle() {
    if (this.form?.valid) {
      let players = this.form.get('players')?.getRawValue();
      if (players.some((p: any) => p.returnBuyIns === null || p.returnBuyIns === undefined)) {
        let errorPlayers = players.filter((p: any) => p.returnBuyIns === null || p.returnBuyIns === undefined).map((p: any) => p.name);
        this.presentAlert(`Please update return buyins for the players ${errorPlayers.join(', ')}`);
      } else if (players.reduce((sum: any, item: { balance: any; }) => sum + item.balance, 0) === 0) {
        this.settleGame();
        this.form.get('isSettled')?.setValue(true);
        this.save();
      } else {
        let totalBalance = players.reduce((sum: any, item: { balance: any; }) => sum + item.balance, 0);
        let settleValidationMessage = totalBalance > 0 ? `Please adjust ReturnBuyIn's by ${totalBalance * 1}` : `Please adjust ReturnBuyIn's by ${totalBalance * -1}`;
        this.presentAlert(settleValidationMessage);
      }
    }
  }

  settleGame() {
    let players = this.form?.get('players')?.getRawValue();
    let profitPlayers = players.filter((p: Player) => (p.balance ?? 0) > 0);
    let lossPlayers = players.filter((p: Player) => (p.balance ?? 0) < 0);

    // Adjust custom settlements
    profitPlayers.forEach((pPlayer: Player) => {
      let customSettledAmount = (this.game?.settlements.filter(s => s.toPlayerId === pPlayer.profileId).reduce((sum: any, item: { amount: number; }) => sum + item.amount, 0))
      if (customSettledAmount && customSettledAmount > 0) {
        pPlayer.balance! -= customSettledAmount / this.game?.buyInValue!;
      }
    });

    lossPlayers.forEach((lPlayer: Player) => {
      let customSettledAmount = (this.game?.settlements.filter(s => s.fromPlayerId === lPlayer.profileId).reduce((sum: any, item: { amount: number; }) => sum + item.amount, 0))
      if (customSettledAmount && customSettledAmount > 0) {
        lPlayer.balance! += customSettledAmount! / this.game?.buyInValue!;
      }
    });

    while (lossPlayers.length > 0) {
      let result = this.settleMatch(profitPlayers, lossPlayers);
      profitPlayers = result.profitPlayers;
      lossPlayers = result.lossPlayers;
      this.settleUmatch(profitPlayers, lossPlayers, result.hasRecord);
    }
  }

  settleMatch(profitPlayers: Player[], lossPlayers: Player[]): { profitPlayers: Player[], lossPlayers: Player[], hasRecord: boolean } {
    profitPlayers = profitPlayers.filter((p: Player) => (p.balance ?? 0) !== 0);
    lossPlayers = lossPlayers.filter((p: Player) => (p.balance ?? 0) !== 0);
    let buyInValue = this.form?.get('buyInValue')?.getRawValue();
    let hasRecord = false;
    for (let index = 0; index < lossPlayers.length; index++) {
      let lPlayer = lossPlayers[index];
      let pPlayer = profitPlayers.find(pPlayer => pPlayer.balance! + lPlayer.balance! === 0);
      if (pPlayer) {
        this.settlements.push({ toPlayerId: pPlayer?.profileId!, fromPlayerId: lPlayer.profileId, amount: (pPlayer.balance ?? 0) * (buyInValue ?? 0) });
        pPlayer.balance = 0;
        lPlayer.balance = 0
        hasRecord = true;
        break;
      }
    }

    return { profitPlayers: profitPlayers, lossPlayers: lossPlayers, hasRecord: hasRecord };
  }

  settleUmatch(profitPlayers: Player[], lossPlayers: Player[], callMatch: boolean): { profitPlayers: Player[], lossPlayers: Player[] } {
    if (callMatch) {
      let result = this.settleMatch(profitPlayers, lossPlayers);
      profitPlayers = result.profitPlayers;
      lossPlayers = result.lossPlayers;
    }

    let buyInValue = this.form?.get('buyInValue')?.getRawValue();
    for (let index = 0; index < lossPlayers.length; index++) {
      let lPlayer = lossPlayers[index]
      let pPlayer = profitPlayers.find(pPlayer => pPlayer.balance! + lPlayer.balance! !== 0);
      if (pPlayer) {
        let adjustBalance = (lPlayer.balance! * -1) > (pPlayer.balance!) ? pPlayer.balance! : (lPlayer.balance! * -1);
        this.settlements.push({ toPlayerId: pPlayer?.profileId!, fromPlayerId: lPlayer.profileId, amount: adjustBalance * (buyInValue ?? 0) });
        pPlayer.balance! -= adjustBalance;
        lPlayer.balance! += adjustBalance;
        break;
      }
    }


    return { profitPlayers: profitPlayers, lossPlayers: lossPlayers };
  }

  async deleteItem(id?: number) {
    await this.service.deleteGame(id!);
    this.router.navigate(['/game']);
  }

  async presentDeleteConfirm() {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete the game?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.deleteItem(this.gameId);
          }
        }
      ]
    });
  
    await alert.present();
  }

  getLossPlayers(): Player[] {
    return this.players.filter(p => p.balance  && p.balance + ((this.game?.settlements?.filter(s => s.fromPlayerId === p.profileId).reduce((sum: any, item: { amount: number; }) => sum + item.amount, 0)) / this.game?.buyInValue!) < 0)
  }

  getGainPlayers(): Player[] {
    return this.players.filter(p => p.balance  && p.balance - ((this.game?.settlements?.filter(s => s.toPlayerId === p.profileId).reduce((sum: any, item: { amount: number; }) => sum + item.amount, 0)) / this.game?.buyInValue!) > 0)
  }

  saveCustomSettle() {
    if (this.settleForm?.valid) {
      let value = this.settleForm.getRawValue();
      this.settlements.push({ fromPlayerId: value.fromPlayerId.profileId, toPlayerId: value.toPlayerId.profileId, amount: value.amount  } as Settlement);
      this.game!.settlements = this.settlements;
      this.isSettleModalOpen = false;
      this.settleForm = undefined;
      this.save(false);
    }
  }

  get settleAmountErrorMessage() {
    if(this.settleForm?.get('amount')?.hasError('max'))
    {
      return `Amount can not exceed ${this.settleForm?.get('amount')?.errors?.['max'].max}`
    }

    return 'Amount is required.'
  }

  customSettle() {
    this.settleForm = GameComponent.buildSettleForm({});
    this.settleForm.get('fromPlayerId')?.valueChanges.pipe(takeUntil(this.destroying$)).subscribe({
      next: _ => {
        this.setSettleAmountValidation();
      }
    });

    this.settleForm.get('toPlayerId')?.valueChanges.pipe(takeUntil(this.destroying$)).subscribe({
      next: _ => {
        this.setSettleAmountValidation();
      }
    });

    this.isSettleModalOpen = true;
  }


  private setSettleAmountValidation() {
    let remainingFromBalance = Number.MAX_VALUE;
    let remainingToBalance = Number.MAX_VALUE;
    let fromPlayer = this.settleForm?.get('fromPlayerId')?.value
    let toPlayer = this.settleForm?.get('toPlayerId')?.value;

    if (fromPlayer) {
      remainingFromBalance = (fromPlayer.balance! * -(this.game?.buyInValue ?? 0)) - (this.game?.settlements.filter(s => s.fromPlayerId === fromPlayer.profileId).reduce((sum: any, item: { amount: number; }) => sum + item.amount, 0));
    }

    if (toPlayer) {
      remainingToBalance = (toPlayer.balance! * (this.game?.buyInValue ?? 0)) - (this.game?.settlements.filter(s => s.toPlayerId === toPlayer.profileId).reduce((sum: any, item: { amount: number; }) => sum + item.amount, 0));
    }

    this.settleForm?.get('amount')?.setValidators(Validators.max(Math.min(remainingFromBalance, remainingToBalance)));
  }
}
