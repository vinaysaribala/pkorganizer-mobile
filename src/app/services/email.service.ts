import { Injectable } from '@angular/core';
import { OrganizeService } from './organize.service';
import { Profile } from '../model/profile';
import { Settlement } from '../model/settlement';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  profiles: Profile[] = [];
  constructor(private profileService: OrganizeService) { }

  // Carrier Email-to-SMS Gateways
  private carrierGateways: { [key: string]: string } = {
    'att': '@txt.att.net',
    'tmobile': '@tmomail.net',
    'verizon': '@vtext.com',
    'sprint': '@messaging.sprintpcs.com',
    'boost': '@myboostmobile.com',
    'metropcs': '@mymetropcs.com'
  };


  sendEmail(settlements: Settlement[]) {
    if (settlements && settlements.length > 0) {
      this.profileService.getProfiles().subscribe({
        next: (data: Profile[]) => {
          if (data) {
            this.profiles = data.filter(d => settlements.some(s => s.fromPlayerId === d.id) || settlements.some(s => s.toPlayerId === d.id));
            let message = settlements.map(s => `${this.profiles.find(p => p.id === s.fromPlayerId)?.name} pays ${s.amount} ${this.profiles.find(p => p.id === s.toPlayerId)?.name}`).join('\n');
            let phoneRecipients = this.profiles.filter((p: Profile) => p.phone && this.carrierGateways[p.carrier]).map((p: Profile) => {
              return `${p.phone}${this.carrierGateways[p.carrier]}`;
            });

            let recipients = phoneRecipients.concat(this.profiles.filter((p: Profile) => p.email).map((p: Profile) => { return p.email }));

            let recipient = recipients.join(',');
            const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent('Poker Buddy')}&body=${encodeURIComponent(message)}`;

            // Open the mail client
            window.open(mailtoUrl, '_system');
          }
        }
      });
    }
  }
}