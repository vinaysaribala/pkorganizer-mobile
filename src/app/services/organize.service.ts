import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Profile } from '../model/profile';
import { StorageService } from './storage.service';
import { Game } from '../model/game';

@Injectable({
  providedIn: 'root'
})
export class OrganizeService {
  private PROFILE_STORAGE_KEY = 'profiles';
  private GAME_STORAGE_KEY = 'games';
  private profiles = new BehaviorSubject<Profile[]>([]);
  private games = new BehaviorSubject<Game[]>([]);
  constructor(private storageService: StorageService) { 
    this.loadData();  
  }

  private async loadData() {
    const profiles = await this.storageService.get<Profile[]>(this.PROFILE_STORAGE_KEY) || [];
    this.profiles.next(profiles);
    const games = await this.storageService.get<Game[]>(this.GAME_STORAGE_KEY) || [];
    this.games.next(games);
  }

  getProfiles(): Observable<Profile[]> {
    return this.profiles.asObservable();
  }

  async addProfile(profile: Omit<Profile, 'id'>): Promise<void> {
    const currentProfiles = this.profiles.value;
    const newProfile: Profile = {
      ...profile,
      id: currentProfiles.length ? Math.max(...currentProfiles.map(p => p.id)) + 1 : 1
    };

    const updatedProfiles = [...currentProfiles, newProfile];
    await this.storageService.set(this.PROFILE_STORAGE_KEY, updatedProfiles);
    this.profiles.next(updatedProfiles);
  }

  async updateProfile(profile: Profile): Promise<void> {
    const currentProfiles = this.profiles.value;
    const updatedProfiles = currentProfiles.map(p => p.id === profile.id ? profile : p);
    await this.storageService.set(this.PROFILE_STORAGE_KEY, updatedProfiles);
    this.profiles.next(updatedProfiles);
  }

  async deleteProfile(id: number): Promise<void> {
    const currentProfiles = this.profiles.value;
    const updatedProfiles = currentProfiles.filter(p => p.id !== id);
    await this.storageService.set(this.PROFILE_STORAGE_KEY, updatedProfiles);
    this.profiles.next(updatedProfiles);
  }

  getGames(): Observable<Game[]> {
    return this.games.asObservable();
  }

  async addGame(game: Omit<Game, 'id'>): Promise<void> {
    const currentGames = this.games.value;
    const newGame: Game = {
      ...game,
      id: currentGames.length ? Math.max(...currentGames.map(g => g.id)) + 1 : 1
    };
    
    const updatedGames = [...currentGames, newGame];
    await this.storageService.set(this.GAME_STORAGE_KEY, updatedGames);
    this.games.next(updatedGames);
  }

  async updateGame(game: Game): Promise<void> {
    const currentGames = this.games.value;
    const updatedGames = currentGames.map(g => g.id === game.id ? game : g);
    await this.storageService.set(this.GAME_STORAGE_KEY, updatedGames);
    this.games.next(updatedGames);
  }

  async deleteGame(id: number): Promise<void> {
    const currentGames = this.games.value;
    const updatedGames = currentGames.filter(g => g.id !== id);
    await this.storageService.set(this.GAME_STORAGE_KEY, updatedGames);
    this.games.next(updatedGames);
  }
}
