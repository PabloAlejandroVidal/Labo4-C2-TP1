import { Component, inject } from '@angular/core';
import { Country, CountryService } from 'app/shared/services/country/country.service';
import { map, Subscription, take } from 'rxjs';
import { GameState, gameStates } from '../../types/gameStateType';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { gameNames, GameService } from '../../services/game/game.service';
import { UserService } from 'app/shared/services/user/user.service';

@Component({
  selector: 'app-preguntados',
  templateUrl: './preguntados.component.html',
  styleUrl: './preguntados.component.scss'
})
export class PreguntadosComponent {
  countryService: CountryService = inject(CountryService);
  gameService: GameService = inject(GameService);
  userService: UserService = inject(UserService);
  router: Router = inject(Router);
  subscriptions: Subscription[] = [];
  gameStates = gameStates;
  gameState: GameState = gameStates.notStarted;

  todosLosPaises: Country[] = [];
  paisesPorAdivinar: Country[] = [];

  paisAAdivinar: Country | null = null;
  paisesParaOpciones: Country[] = [];

  paisesAdivinados: number = 0;
  record: number = 0;
  user: any = null;


  public readonly menuOptions = {
    init: {
      label: 'Comenzar Juego',
      action: ()=> {
        this.startGame();
      }
    },
    resume: {
      label: 'Reanudar Juego',
      action: ()=> {
        this.pause(false);
      }
    },
    restart: {
      label: 'Nuevo Juego',
      action: ()=> {
        this.restartGame();
      }
    },
    goRanking: {
      label: 'Ranking',
      action: ()=>{
      }
    },
    goHelp: {
      label: 'Ayuda',
      action: ()=>{
      }
    },
    exit: {
      label: 'Salir',
      action: ()=>{
        this.finalizarJuego();
      }
    },
  }

  mainMenuItems = [this.menuOptions.init, this.menuOptions.goRanking, this.menuOptions.goHelp, this.menuOptions.exit];
  pauseMenuItems = [this.menuOptions.resume, this.menuOptions.goRanking, this.menuOptions.goHelp, this.menuOptions.exit];
  gameOverMenuItems = [this.menuOptions.restart, this.menuOptions.goRanking, this.menuOptions.goHelp, this.menuOptions.exit];

  ngOnInit(): void {
    this.user = this.userService.lastUser;
    const subscription: Subscription = this.gameService.observeScore(this.user, gameNames.preguntados).subscribe((docScore)=>{
      this.record = docScore.score;
    })
    this.subscriptions.push(subscription);
    this.obtenerPaisesDesdApi();
  }

  obtenerPaisesDesdApi() {
    const subscription: Subscription = this.countryService.getAllCountries()
    .pipe(take(1))
    .subscribe((countries)=>{
      this.todosLosPaises = countries;
      this.initGame();
    })

    this.subscriptions.push(subscription);
  }

  initGame() {
    //obtengo los 10 paises por los que se preguntara
    const shuffledCountries = this.countryService.shuffleArray(this.todosLosPaises)
    this.paisesPorAdivinar = shuffledCountries.slice(0, 10);
  }

  startGame() {
    this.gameState = gameStates.playing;
    this.makeRiddle();
  }

  makeRiddle() {

    this.paisAAdivinar = this.obtenerPaisParaAdvinar();
    this.paisesParaOpciones = this.todosLosPaises.slice(0, 3);

    if (!this.paisesParaOpciones.includes(this.paisAAdivinar)){
      this.paisesParaOpciones[0] = this.paisAAdivinar;
    }
  }



  obtenerPaisParaAdvinar(): Country {
    const randomIndex = Math.floor(Math.random() * this.paisesPorAdivinar.length);
    const pais = this.paisesPorAdivinar[randomIndex];
    this.paisesPorAdivinar.splice(randomIndex, 1); // Elimina la carta directamente del mazo
    return pais;
  }

  selectOption(paisNameSelected: string) {
    if (!this.paisAAdivinar) {
      return;
    }
    if (paisNameSelected === this.paisAAdivinar.name){
      this.paisesAdivinados++;
      Swal.fire(
        'Correcto!',
        `La bandera es de ${this.paisAAdivinar.name}`,
        'success'
      );
    }else{
      Swal.fire(
        'Incorrecto!',
        `La bandera es de ${this.paisAAdivinar.name}`,
        'warning'
      );
    }
    if (this.paisesPorAdivinar.length === 0){
      Swal.fire(
        'Fin del Juego!',
        `Has adivinado ${this.paisesAdivinados} de 10 paises`,
        'info'
      );
      if (this.user && this.paisesAdivinados > this.record){
        this.gameService.recordNewScore(this.user, gameNames.ahorcado, this.record);
      }
    }
    this.makeRiddle();
  }


  restartGame() {
    this.gameState = gameStates.playing;
  }

  pause(shouldPause: boolean) {
    if (this.gameState === gameStates.playing || this.gameState === gameStates.paused){
      if (shouldPause){
        this.gameState = gameStates.paused;
      }else{
        this.gameState = gameStates.playing;
      }
    }
  }

  finalizarJuego() {
    this.router.navigateByUrl("home");
  }


  ngOnDestroy(): void {
    this.subscriptions.forEach((sub)=>{
      sub.unsubscribe();
    })
  }
}
