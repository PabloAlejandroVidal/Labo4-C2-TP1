import { Injectable, inject } from '@angular/core';
import { LoginData, loginDataInit } from '../../interfaces/login-data';
import { CollectionReference, addDoc, collection, collectionData, getDoc, getDocs, onSnapshot, query, runTransaction, where, updateDoc, QuerySnapshot, DocumentReference, QueryDocumentSnapshot, limit } from '@angular/fire/firestore';
import { DocumentData, Firestore, doc} from '@angular/fire/firestore';
import { UserData, userDataInit } from '../../interfaces/user-data';
import { filter, from, map, Observable, of, pipe, reduce, switchMap } from 'rxjs';
import { DocumentSnapshot, orderBy } from 'firebase/firestore';
import { Timestamp } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})

export class FirestoreService {

  private firestore: Firestore = inject(Firestore);


  private usersCollection = collection(this.firestore, 'users');
  private loginsCollection = collection(this.firestore, 'logins');

  private allUsersQuery = query(this.usersCollection);
  private onlineUsersQuery = query(this.usersCollection, where('isOnline', '==', true));

  private getUserByEmailQuery = (email: string)=>{return query(this.usersCollection, where('email', '==', email));}

  private getLoginsCollectionByUserDocRef = (userDocRef: DocumentReference)=>{return collection(userDocRef, 'logins')}


  async getUserDocs(email: string) {
    const usuariosConEmailIngresado = query(this.usersCollection, where('email', '==', email));
    return await getDocs(usuariosConEmailIngresado);
  }

  async userExists(email: string): Promise<boolean> {
    try{
      const docs = await this.getUserDocs(email);
      return !docs.empty;
    }
    catch (error: any){
      console.error(error);
      throw Error("No se pudo comprobar la existencia del usuario");
    }
  }

  async scheduleChat(user1Doc: QueryDocumentSnapshot<DocumentData, DocumentData>,
    user2Doc: QueryDocumentSnapshot<DocumentData, DocumentData>,
    docId: string){

      //actualizo la agenda de los usuarios con el nuevo chat
   updateDoc(user1Doc.ref, {chats: {[user2Doc.id]: docId }});
   updateDoc(user2Doc.ref, {chats: {[user1Doc.id]: docId }});
 }

  async createChat(userFrom: any, userTo: any){
    //determino quien es el usuario 1 y 2 por orden alfabetico
    const userRef1 = userFrom.id < userTo.id ? userFrom.id : userTo.id;
    const userRef2 = userRef1 != userFrom.id ? userFrom.id : userTo.id;

    const chatsCollection = collection(this.firestore, 'chats');

    //agrego un nuevo documento chat con las referencias a los usuarios
    return addDoc(chatsCollection, {userRef1, userRef2})
    .then((chat)=>{
      //agendo la referencia al chat para cada uno de los usuarios
      this.scheduleChat(userFrom, userTo, chat.id);
      return chat;
    })
  }

  async getChatReference(userFrom:  DocumentSnapshot<DocumentData, DocumentData>, userTo:  DocumentSnapshot<DocumentData, DocumentData>){
    //busco la referencia al chat en la agenda de cualquiera de los dos usuarios, si no existe creo el chat
    //
    //podria actualizarse la funcion para que revise en ambas agendas, pero si no se altero la base de datos deberia ser consistente y existir el mismo chat para ambos
    const userData = userFrom.data() as any;
    const idTo = userTo.id;
    const chatPathReference = userData['chats'][idTo] || await this.createChat(userFrom, userTo);

    return chatPathReference;
  }

  async sendMessage(userFrom:  DocumentSnapshot<DocumentData, DocumentData>, userTo:  DocumentSnapshot<DocumentData, DocumentData>, chatDocRef : any, text: string){
    //agrego el mensaje a la collecion de mensajes (chat) de ambos usuarios

    const usersCollection = collection(chatDocRef, 'messages');
    const message = {
      text,
      sent: new Date(),
      from: userFrom.ref,
      to: userTo.ref,
    }

    addDoc(usersCollection, message)
    .then((doc)=>{
    });
  }

  async getChat(userFrom: QueryDocumentSnapshot<DocumentData, DocumentData>, userTo: QueryDocumentSnapshot<DocumentData, DocumentData>) {
    //carga la lista de mensajes para que puedan ser leidos por el usuario

    const docUser = await getDoc(userFrom.ref);
    const userData = docUser.data() as any;
    const chatRef = userData['chats'][userTo.ref.id] || this.createChat(userFrom, userTo);


    const referenciaAlChat = doc(this.firestore, 'chats', chatRef);

    const chatMessages = collection(referenciaAlChat, 'messages');
    const ordererMessages = query(chatMessages, orderBy('sent'));

    return new Observable<[]>((observer) => {
      const unsubscribe = onSnapshot(ordererMessages, (querySnapshot) => {
        const messages: any = [];
        querySnapshot.forEach((doc) => {
          messages.push(doc.data());
        });
        observer.next(messages);
      });

      return () => unsubscribe();
    });

  }

  getUsersOnline(): Observable<UserData[]> {
    return collectionData(this.onlineUsersQuery, { idField: 'id' }) as Observable<UserData[]>;
  }

  async getUser(email: string){
    const userByEmailQuery = this.getUserByEmailQuery(email);
    const querySnapShot = await getDocs(userByEmailQuery);

    if (querySnapShot.size > 0) {
      return querySnapShot.docs[0];
    }
    return null;
  }

  async updateUserStatus(email: string, status: boolean) {
    const currentUser = await this.getUser(email);
    if (currentUser?.ref != null){
      const userRef = currentUser.ref;

      await runTransaction(this.firestore, async (transaction) => {
        // Ejecuta una transacción
        const userDoc = await transaction.get(userRef);

        // Obtiene el documento dentro de la transacción
        const userData = userDoc.data();
        // Obtiene los datos del documento
        if(userData){

          const LastAccess = Timestamp.fromDate(new Date());
          userData['lastAccess'] = LastAccess;
          userData['isOnline'] = status;

          if(userData && userData['firstAccess'] == null){
            userData['firstAccess'] = LastAccess;
          }

          transaction.update(userRef, userData); // Actualiza el documento con los nuevos datos
        }

      });
    }
  }

  async registerUser(email: string) {

    const userData: UserData = userDataInit;
    userData.email = email;
    userData.registrationDate = new Date();

    addDoc(this.usersCollection, userData);
  }

  registerLogin(email: string) {

    const loginData: LoginData = loginDataInit;
    loginData.loginDate = new Date();
    loginData.user = email;

    getDocs(this.getUserByEmailQuery(email)).then((querySnapShot)=>{

      querySnapShot.forEach((documentSnapshot)=>{
        const userDocRef = doc(this.firestore, `users/${documentSnapshot.id}`);
        const loginsCollectionRef = this.getLoginsCollectionByUserDocRef(userDocRef);
        addDoc(loginsCollectionRef, loginData).then((r)=>{
        }).catch((e)=>{
        })
      })
    })
  }

// Función que obtiene la referencia de los logins del usuario por email
observeLoginsRef(email: string): Observable<CollectionReference<DocumentData, DocumentData>> {
  return from(getDocs(this.getUserByEmailQuery(email))).pipe(
    filter((querySnapShot)=>{
      return !querySnapShot.empty;
    }),
    map((querySnapshot) => {
      const userDoc = querySnapshot.docs[0];
      return this.getLoginsCollectionByUserDocRef(userDoc.ref);
    })
  );
}

// Obtener los logins recientes como un Observable
observeRecentLogins(email: string, date: Date): Observable<any> {
  return this.observeLoginsRef(email).pipe(
    map((loginsRef) => {
      return loginsRef ? query(loginsRef, where('loginDate', '>=', date)) : null;
    })
  );
}

// Obtener el último login como un Observable
observeLatestLogin(email: string): Observable<DocumentSnapshot> {
  return this.observeLoginsRef(email).pipe(
    switchMap((loginsRef) => {
      const latestLoginsQuery = query(loginsRef, orderBy('loginDate', 'desc'), limit(1));
      return from(getDocs(latestLoginsQuery)).pipe(
        filter(value => value !== null && value !== undefined),
        map((snapshot) => snapshot.docs[0])
      );
    })
  );
}


  getLogins(email: string): Observable<any[]> {
    // Convertir la obtención del usuario a un flujo observable
    return from(getDocs(this.getUserByEmailQuery(email))).pipe(
      switchMap(querySnapshot => {
        if (!querySnapshot.empty) {
          const userDocRef = querySnapshot.docs[0].ref; // Obtener referencia del documento del usuario
          const loginsCollectionRef = this.getLoginsCollectionByUserDocRef(userDocRef);

          // Crear un observable a partir de la colección de logins
          return new Observable<any[]>((observer) => {
            const allLoginsQuery = query(loginsCollectionRef);

            // Escuchar cambios en la colección de logins
            const unsubscribe = onSnapshot(allLoginsQuery, (querySnapshot) => {
              const logins = querySnapshot.docs.map(doc => doc.data()); // Obtener los datos de los logins
              observer.next(logins); // Emitir los logins
            });

            return () => unsubscribe(); // Devolver la función de limpieza para detener la escucha
          });
        } else {
          // Si no hay usuarios encontrados, devolver un observable vacío o con una lista vacía
          return of([]);
        }
      })
    );
  }

  getNumberOfLogins(email: string): Observable<number> {
    return this.getLogins(email).pipe(map((docs)=>{return docs.length}))
  }



/*   registerLogin2(email: string) {
    const loginData: LoginData = loginDataInit;
    loginData.fechaInicio = new Date();
    loginData.usuario = email;

    addDoc(this.loginsCollection, loginData).then((r)=>{
    }).catch((e)=>{
    })
  } */

/*   getNumberOfLogins(email: string): Observable<number> {
    const loginsCollection = collection(this.firestore, 'logins');
    const usuariosOnlineQuery = query(loginsCollection, where('usuario', '==', email));

    return new Observable<number>((observer) => {
      const unsubscribe = onSnapshot(usuariosOnlineQuery, (query) => {

        observer.next(query.size);
      });

      return () => unsubscribe();
    });
  } */


}
