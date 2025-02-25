import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { gapi } from 'gapi-script';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
  private API_KEY = 'YOUR_GOOGLE_API_KEY';
  private SCOPES = 'https://www.googleapis.com/auth/gmail.send';

  constructor() {
    this.loadGapi();
  }

  // Carrier Email-to-SMS Gateways
  private carrierGateways: { [key: string]: string } = {
    'att': '@txt.att.net',
    'tmobile': '@tmomail.net',
    'verizon': '@vtext.com',
    'sprint': '@messaging.sprintpcs.com',
    'boost': '@myboostmobile.com',
    'metropcs': '@mymetropcs.com'
  };

  private loadGapi() {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: this.API_KEY,
        clientId: this.CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
        scope: this.SCOPES
      });
    });
  }

  // Sign in User
  async signIn() {
    await gapi.auth2.getAuthInstance().signIn();
    console.log('User signed in!');
  }

  // Send Email via Gmail API
  async sendEmail(phoneNumber: string, message: string, carrier: string) {
    await this.signIn(); // Ensure user is signed in
    const gateway = this.carrierGateways[carrier.toLowerCase()];
    if (!gateway) {
      console.error('Unsupported carrier');
      return;
    }
    const email = [
      `To: ${phoneNumber}${gateway}`,
      'Subject: ""',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      message
    ].join('\n');

    const base64EncodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');

    return gapi.client.gmail.users.messages.send({
      userId: 'me',
      resource: { raw: base64EncodedEmail }
    }).then(() => {
      console.log('Email sent successfully!');
    }).catch((error: any) => {
      console.error('Error sending email:', error);
    });
  }
}