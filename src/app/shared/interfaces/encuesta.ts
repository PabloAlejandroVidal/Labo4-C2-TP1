import { Timestamp } from "@angular/fire/firestore";

export interface Encuesta {
  id?: string;
  name: string;
  age: number;
  phoneNumber: string;
  questions: {
    question1: boolean;
    question2: string;
    question3: string;
  };
  createdAt: Timestamp;
}
