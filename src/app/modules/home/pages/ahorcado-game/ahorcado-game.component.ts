import { Component, inject, Input } from '@angular/core';
import Swal from 'sweetalert2';
import { GameService } from '../../services/game/game.service';
import { routes } from 'app/app.routes';
import { Router } from '@angular/router';


// Definir los estados del juego en un objeto
const gameStates = {
  notStarted: 'notStarted',
  playing: 'playing',
  paused: 'paused',
  gameOver: 'gameOver',
} as const;
type GameState = keyof typeof gameStates;

@Component({
  selector: 'app-ahorcado-game',
  templateUrl: './ahorcado-game.component.html',
  styleUrl: './ahorcado-game.component.scss'
})
export class AhorcadoGameComponent {
  ahorcadoGameComponent = AhorcadoGameComponent;;
  @Input() isMenuActive: boolean = false;
  router = inject(Router);
  gameService: GameService = inject(GameService);
  gameStates = gameStates;
  gameState: GameState = gameStates.notStarted;

  word: string[] = [];
  // writtenLetters: Set<string> = new Set();
  wordOnScreen: string[] = [];
  disabledKeys: string[] = [];


  letrasRestantes = 0;
  errores = 0;
  vidasRestantes = 6;
  public static stickImgs = [
  'assets/games/stick6.png',
  'assets/games/stick5.png',
  'assets/games/stick4.png',
  'assets/games/stick3.png',
  'assets/games/stick2.png',
  'assets/games/stick1.png',
  'assets/games/stick0.png'];
  public static words: string[] = ['bienvenido', 'alumno', 'libreria', 'computadora'];
  public static vida = 'assets/games/heart.png';
  public static repeatedImageUrl = 'assets/games/stick-word-space.png';

  public readonly menuOptions = {
    init: {
      label: 'Comenzar Juego',
      action: ()=> {
        this.initGame();
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


  initGame() {
    this.getWord();
    this.setWordSlotsOnScreen();
    this.setLettersLeft();
    this.setLives();
    this.gameState = gameStates.playing;
  }

  restartGame() {
    this.getWord();
    this.setWordSlotsOnScreen();
    this.setLettersLeft();
    this.setLives();
    this.cleanKeyBoard();
    this.gameState = gameStates.playing;
  }

  private getWord() {
    const indexRandom = Math.floor(Math.random() * AhorcadoGameComponent.words.length);
    const word = AhorcadoGameComponent.words[indexRandom];
    this.word = word.toUpperCase().split('');
  }

  private setWordSlotsOnScreen() {
    this.wordOnScreen = [];
    this.word.forEach(()=>{
      this.wordOnScreen.push('');
    });
  }

  private setLettersLeft() {
    this.letrasRestantes = this.word.length;
  }

  private setLives() {
    this.vidasRestantes = 6;
  }

  private cleanKeyBoard() {
    this.disabledKeys = [];
  }

  onKeyPress(key: string) {

    this.disabledKeys.push(key);

    if (!this.word.includes(key)){
      this.marcarError();
    }else{
      this.agregarLetra(key);
    }
  }


  private marcarError() {
    this.errores++;
    this.vidasRestantes--;
    this.comprobarSiPerdio();
  }

  private comprobarSiPerdio() {
    if (this.vidasRestantes == 0){
      this.gameOver();
    }
  }

  private gameOver() {
    this.gameState = gameStates.gameOver;
    Swal.fire(
      'Fin del Juego!',
      'Te has quedado sin vidas.',
      'info'
    )
  }

  private agregarLetra(key: string) {
    this.word.forEach((value, index) => {
      if (value === key){
        this.wordOnScreen[index] = key;
        this.letrasRestantes--;
      }
    })
    this.comprobarSiGano();
  }

  private comprobarSiGano() {
    if(this.letrasRestantes == 0){
      this.gameOver();
    }
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
}
