import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, doc, docData, DocumentData, DocumentReference, Firestore, getDocs, query, runTransaction, Transaction, where } from '@angular/fire/firestore';
import { BehaviorSubject, filter, from, map, Observable } from 'rxjs';

export enum gameNames{
  ahorcado = 'ahorcado',
  mayorMenor = 'mayor-menor',
  conectaCuatro = 'conecta-cuatro',
  preguntados = 'preguntados',
}

export class GameService {

  private firestore: Firestore = inject(Firestore);

  public COLLECTIONS = {
    USERS: 'users',
    SCORES: 'scores',
  };

  constructor() { }

  observeScore(email: string, nombreJuego: gameNames): Observable<any> {
    const collectionRef = collection(this.firestore, this.COLLECTIONS.SCORES);
    const scoreOfUser = query(collectionRef, where('user', '==', email), where('game', '==', nombreJuego));

    return collectionData(scoreOfUser, { idField: 'id' }).pipe(
      filter((e)=>{
        return e[0] && true;
      }),
      map((e)=>{
        return e[0];
      })
    );
  }

  async updateScore(ref: DocumentReference<DocumentData>, newData: { score: number }): Promise<void> {
    try {
      await runTransaction(this.firestore, async (transaction: Transaction) => {
        const doc = await transaction.get(ref);
        const data = doc.data() as { score: number };

        // Solo actualizar si el nuevo puntaje es mayor
        if (data && data.score < newData.score) {
          transaction.update(ref, { ...data, ...newData });
        }
      });
    } catch (error) {
      console.error('Error al actualizar el puntaje:', error);
    }
  }

  async recordNewScore(email: string, game: gameNames, score: number): Promise<void> {
    try {
      const newScore = {
        user: email,
        score: score,
        game: game,
        registered: new Date(),
      };
      const collectionRef = collection(this.firestore, this.COLLECTIONS.SCORES);
      const scoreQuery = query(collectionRef, where('user', '==', email), where('game', '==', game));

      const querySnapshot = await getDocs(scoreQuery);

      // Verifica si el usuario ya tiene un puntaje registrado para este juego
      if (!querySnapshot.empty) {
        const existingScoreRef = querySnapshot.docs[0].ref;
        await this.updateScore(existingScoreRef, newScore);
      } else {
        // Si no hay puntaje previo, crea un nuevo documento
        await addDoc(collectionRef, newScore);
      }
    } catch (error) {
      console.error('Error al registrar el nuevo puntaje:', error);
    }
  }

}
