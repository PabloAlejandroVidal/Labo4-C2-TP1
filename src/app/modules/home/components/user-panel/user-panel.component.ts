import { Component, EventEmitter, inject, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { UserService } from 'app/shared/services/user/user.service';

@Component({
  selector: 'app-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrl: './user-panel.component.scss'
})
export class UserPanelComponent {
  btnStatus: boolean = false;
  @Output () btnClicked: EventEmitter<boolean> = new EventEmitter();

  userService: UserService = inject(UserService);
  router: Router = inject(Router);
  user: string = '';
  numberOfLogins: number = 0;
  lastAccess: Date | any = null;


  constructor(){
    this.userService.observeCurrentUser().subscribe((user)=>{
      this.user = user?.email || '';

      this.userService.getNumberOfLogins(this.user).subscribe((logins)=>{
        this.numberOfLogins = logins
      })
      this.userService.observeLastestLogin(this.user).subscribe((doc)=>{
        const data: any = doc.data();
        this.lastAccess = data['loginDate'].toDate();

      })
    });

  }

  logout(){
    this.userService.logOutUser();
  }

  onClick() {
    // Emitir un evento al padre cuando se hace clic en el botón
    this.btnStatus = !this.btnStatus;
    this.btnClicked.emit(this.btnStatus);
  }
}
