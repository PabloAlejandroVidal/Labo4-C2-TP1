import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EncuestaService } from 'app/shared/services/encuesta/encuesta.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule ,ReactiveFormsModule],
  templateUrl: './encuesta.component.html',
  styleUrl: './encuesta.component.scss'
})
export class EncuestaComponent {
  surveyForm: FormGroup;
  encuestaService: EncuestaService = inject(EncuestaService);

  constructor(private fb: FormBuilder) {
    this.surveyForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      age: ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      question1: ['', Validators.required],
      question2: ['', Validators.required],
      question3: ['', Validators.required]
    });
  }

  async onSubmit() {
    try{
    if (this.surveyForm.valid) {
        await this.encuestaService.guardarEncuesta(this.surveyForm.value);
        Swal.fire('Gracias!',
          'Has cargado y enviado la encuesta correctamente',
          'success'
        );

      } else {
        Swal.fire('Error!',
          'El formulario contiene datos no validos',
          'error'
        );
      }
    }
    catch{

      Swal.fire('Error!',
        'Error al cargar la encuesta',
        'error'
      );
    }
  }
}
