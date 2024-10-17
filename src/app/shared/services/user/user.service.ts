import { Injectable, inject } from '@angular/core';
import { AuthResult, AuthResultInit, AuthService } from '../auth/auth.service';
import { FirestoreService } from '../firestore/firestore.service';
import { AuthData } from '../../interfaces/auth-data';
import { User } from 'firebase/auth';
import { filter, map, Observable } from 'rxjs';
import { ActivatedRoute, IsActiveMatchOptions, Router } from '@angular/router';



@Injectable({
  providedIn: 'root'
})
export class UserService {

  router: Router = inject(Router);
  lastUser: string | null = null;
  firstLoad: boolean = true;

  constructor(
    private authService: AuthService,
    private firestoreService: FirestoreService
  ) {
    this.observeCurrentUser().subscribe((user)=>{
      this.udateUserState(user);
      this.redirect(user);
    })
  }


  async registerUser(authData: AuthData): Promise<AuthResult> {
    const authResult: AuthResult = AuthResultInit;
    try{
      const userExists = await this.firestoreService.userExists(authData.email);
      if (userExists) {
        authResult.success = false;
        authResult.authError = {
          code: 'Usuario en uso',
          message: 'El usuario ya se encuentra registrado.',
        }
        return authResult;
      }
      return await this.authService.register(authData.email, authData.password);
    }catch (error: any){
        authResult.success = false,
        authResult.authError = {
          code: 'Error inesperado',
          message: error.message,
        }
    }
    finally{
      return authResult;
    }
  }

  async loginUser(authData: AuthData): Promise<AuthResult> {
    const authResult: AuthResult = AuthResultInit;
    try {
      const userExists = await this.firestoreService.userExists(authData.email);
      if (!userExists) {
        authResult.success = true;
        authResult.authError = {
          code: 'Usuario no encontrado',
          message: 'No se pudo encontrar el usuario.',
        }
      }
      const authResultFromLogin = await this.authService.login(authData.email, authData.password);
      if (authResultFromLogin.success) {
        this.firestoreService.registerLogin(authData.email);
      }
    } catch (error: any) {
      authResult.success = false;
      authResult.authError = {
        code: 'Error inesperado',
        message: error.message,
      }
    }
    finally{
      return authResult;
    }
  }

  async logOutUser(): Promise<AuthResult> {
    const authResult: AuthResult = AuthResultInit;
    try {
      return this.authService.logout();
    }
    catch (error: any) {
      authResult.authError = {
        code: 'Error inesperado',
        message: error.message,
      }
    }
    finally{
      return authResult;
    }
  }


  private udateUserState(user: User | null) {
    if (user?.email){
      this.lastUser = user?.email;
      this.firestoreService.updateUserStatus(this.lastUser, true);
    }
    else{
      (this.lastUser && this.firestoreService.updateUserStatus(this.lastUser, false));
    }

  }

  private match: IsActiveMatchOptions = {
    paths: 'subset',
    matrixParams: 'ignored',
    queryParams: 'ignored',
    fragment: 'ignored'
  }

  private redirect(user: User | null){
    if(!this.firstLoad){

      if (user?.email){
        this.router.navigateByUrl('home');
      }else{
        this.router.navigateByUrl('auth');
      }
    }else{
      this.firstLoad = false;
    }
  }


  observeCurrentUser(): Observable<User | null> {
    return this.authService.user$.pipe(
      map(user => { return user })
    );
  }

  getNumberOfLogins(email: string): Observable<any> {
    return this.firestoreService.getNumberOfLogins(email);
  }

  observeLastestLogin(email: string) {
    return this.firestoreService.observeLatestLogin(email);
  }

}
